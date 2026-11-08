import { create } from 'zustand';
import type { Itinerary, ItinerarySummary } from '@/lib/types/itinerary';
import {
  fetchMyItineraries,
  selectAlternative,
  deleteItinerary,
  reorderSteps,
  deleteStep,
} from '@/lib/data/itineraryService';

/**
 * 백엔드 assignSlot과 같게 시간은 위치(슬롯)에 고정하고 이동한 스텝이 그 시간을 물려받는다.
 * 시간을 스텝에 붙여 옮기면 타임라인이 비단조로 보인다. 교통정보는 서버 응답이 채운다.
 */
function reorderStepsLocally(
  itinerary: Itinerary,
  dayNumber: number,
  orderedStepIds: number[],
): Itinerary {
  const daySteps = itinerary.steps
    .filter((s) => s.dayNumber === dayNumber)
    .sort((a, b) => a.stepOrder - b.stepOrder);
  const slots = daySteps.map((s) => s.stepOrder);
  // 뮤테이션 전에 캡처해야 슬롯 시간이 섞이지 않는다.
  const slotTimes = new Map<number, { startTime: string | null; endTime: string | null }>();
  daySteps.forEach((s) => slotTimes.set(s.stepOrder, { startTime: s.startTime, endTime: s.endTime }));
  const newSlotById = new Map<number, number>();
  orderedStepIds.forEach((id, i) => newSlotById.set(id, slots[i]));
  return {
    ...itinerary,
    steps: itinerary.steps.map((s) => {
      if (!newSlotById.has(s.id)) return s;
      const slot = newSlotById.get(s.id)!;
      const t = slotTimes.get(slot)!;
      return { ...s, stepOrder: slot, startTime: t.startTime, endTime: t.endTime };
    }),
  };
}

interface ItineraryState {
  currentItinerary: Itinerary | null;
  itineraries: ItinerarySummary[];
  selectedDay: number;
  selectedStepId: number | null;
  expandedStepId: number | null;
  isLoading: boolean;
  isDeleting: boolean;
  isSelectingAlternative: boolean;
  alternativeError: string | null;
  /** 편집 진행 중. 중복 요청 가드. */
  isEditingSteps: boolean;
  stepError: string | null;
  loadingProgress: number; // 0-100
  /** story가 비동기로 채워지는 중인지. 상세 페이지 폴링이 제어한다. */
  storyPending: boolean;
}

interface ItineraryActions {
  setCurrentItinerary: (itinerary: Itinerary) => void;
  /** 보고 있는 day/확장 상태를 유지한 채 일정 데이터만 교체한다. */
  refreshCurrentItinerary: (itinerary: Itinerary) => void;
  /**
   * 폴링 전용 머지. 편집으로 바뀐 steps 순서·집합은 두고 id가 같은 스텝의 채움 필드만 덮어써
   * stale 폴링 응답이 편집 결과를 되돌리지 못하게 한다.
   */
  applyAsyncFill: (fresh: Itinerary) => void;
  setSelectedDay: (day: number) => void;
  setSelectedStep: (stepId: number | null) => void;
  toggleExpandStep: (stepId: number) => void;
  selectAlternativeStep: (itineraryId: number, stepId: number, alternativeId: number) => Promise<void>;
  clearAlternativeError: () => void;
  /** 낙관 반영 후 서버 확정, 실패 시 스냅샷 롤백. */
  reorderStepsAction: (itineraryId: number, dayNumber: number, orderedStepIds: number[]) => Promise<void>;
  deleteStepAction: (itineraryId: number, stepId: number) => Promise<void>;
  clearStepError: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setStoryPending: (pending: boolean) => void;
  loadItineraries: (size?: number) => Promise<void>;
  /** 중복 클릭은 isDeleting으로 무시한다. */
  removeItinerary: (id: number) => Promise<void>;
  /** 상세에서 바꾼 제목·태그·상태를 사이드바·목록용 요약에도 반영 */
  patchItinerarySummary: (id: number, patch: Partial<ItinerarySummary>) => void;
}

/** 백엔드 buildDraftTitle이 만드는 임시 제목("서울 1박 2일", "서울 당일치기", "서울 여행")인지. */
function isDraftTitle(title: string | null | undefined): boolean {
  return !title || /(\d+박 \d+일|당일치기| 여행)$/.test(title);
}

export const useItineraryStore = create<ItineraryState & ItineraryActions>((set) => ({
  currentItinerary: null,
  itineraries: [],
  selectedDay: 1,
  selectedStepId: null,
  expandedStepId: null,
  isLoading: false,
  isDeleting: false,
  isSelectingAlternative: false,
  alternativeError: null,
  isEditingSteps: false,
  stepError: null,
  loadingProgress: 0,
  storyPending: false,

  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary, selectedDay: 1 }),

  refreshCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),

  applyAsyncFill: (fresh) =>
    set((state) => {
      const cur = state.currentItinerary;
      if (!cur || cur.id !== fresh.id) return { currentItinerary: fresh };
      const freshById = new Map(fresh.steps.map((s) => [s.id, s]));
      const steps = cur.steps.map((s) => {
        const f = freshById.get(s.id);
        if (!f) return s; // 편집으로 삭제된/추가된 스텝은 현재 상태 유지
        // 순서(stepOrder)·시간·교통은 편집 반영 값을 보존하고 비동기 채움 필드만 덮어쓴다.
        const place =
          s.place && f.place ? { ...s.place, imageUrl: f.place.imageUrl ?? s.place.imageUrl } : s.place;
        return { ...s, notes: f.notes ?? s.notes, place };
      });
      // 제목은 story가 끝나면 서버가 임시 제목을 교체한다. 화면 제목이 임시 제목일 때만 따라야
      // 사용자가 고친 직후 도착한 이전 폴링 응답이 되돌리지 않는다.
      const title = fresh.title && isDraftTitle(cur.title) ? fresh.title : cur.title;
      return {
        currentItinerary: {
          ...cur,
          title,
          coverImage: fresh.coverImage ?? cur.coverImage,
          steps,
        },
      };
    }),

  setSelectedDay: (day) => set({ selectedDay: day, selectedStepId: null }),

  setSelectedStep: (stepId) => set({ selectedStepId: stepId }),

  toggleExpandStep: (stepId) =>
    set((state) => ({
      expandedStepId: state.expandedStepId === stepId ? null : stepId,
    })),

  selectAlternativeStep: async (itineraryId, stepId, alternativeId) => {
    const state = useItineraryStore.getState();
    if (state.isSelectingAlternative) return;
    set({ isSelectingAlternative: true, alternativeError: null });
    try {
      const updated = await selectAlternative(itineraryId, stepId, alternativeId);
      set({ currentItinerary: updated, expandedStepId: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '대안 선택에 실패했습니다.';
      set({ alternativeError: msg });
    } finally {
      set({ isSelectingAlternative: false });
    }
  },

  reorderStepsAction: async (itineraryId, dayNumber, orderedStepIds) => {
    const state = useItineraryStore.getState();
    if (state.isEditingSteps || !state.currentItinerary) return;
    const snapshot = state.currentItinerary;
    // 교통정보는 서버 응답이 채운다.
    set({
      isEditingSteps: true,
      stepError: null,
      currentItinerary: reorderStepsLocally(snapshot, dayNumber, orderedStepIds),
    });
    try {
      const updated = await reorderSteps(itineraryId, dayNumber, orderedStepIds);
      set({ currentItinerary: updated });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '순서 변경에 실패했습니다.';
      set({ currentItinerary: snapshot, stepError: msg });
    } finally {
      set({ isEditingSteps: false });
    }
  },

  deleteStepAction: async (itineraryId, stepId) => {
    const state = useItineraryStore.getState();
    if (state.isEditingSteps || !state.currentItinerary) return;
    set({ isEditingSteps: true, stepError: null });
    try {
      const updated = await deleteStep(itineraryId, stepId);
      set({ currentItinerary: updated, expandedStepId: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '일정 삭제에 실패했습니다.';
      set({ stepError: msg });
    } finally {
      set({ isEditingSteps: false });
    }
  },

  clearStepError: () => set({ stepError: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearAlternativeError: () => set({ alternativeError: null }),

  setLoadingProgress: (progress) => set({ loadingProgress: Math.max(0, Math.min(100, progress)) }),

  setStoryPending: (pending) => set({ storyPending: pending }),

  loadItineraries: async (size?: number) => {
    // in-flight 가드: Sidebar/MainPage/HeaderSearch가 거의 동시에 호출해 생기는
    // 중복 요청·레이스(작은 size 응답이 큰 size 응답을 덮어씀)를 방지한다.
    if (useItineraryStore.getState().isLoading) return;
    set({ isLoading: true });
    try {
      const page = await fetchMyItineraries(0, size ?? 20);
      set({ itineraries: page.content });
    } catch {
      // 호출부가 UI 에러를 따로 처리하므로 삼킨다(unhandled rejection 방지).
    } finally {
      set({ isLoading: false });
    }
  },

  removeItinerary: async (id) => {
    if (useItineraryStore.getState().isDeleting) return;
    set({ isDeleting: true });
    try {
      await deleteItinerary(id);
      // 재조회 실패와 무관하게 로컬 목록에서 바로 뺀다.
      set((state) => ({ itineraries: state.itineraries.filter((it) => it.id !== id) }));
      // 재조회가 실패해도 삭제 성공을 되돌리지 않는다.
      try {
        const page = await fetchMyItineraries();
        set({ itineraries: page.content });
      } catch {
        /* 목록 정합성은 다음 로드에서 회복 */
      }
    } finally {
      set({ isDeleting: false });
    }
  },

  patchItinerarySummary: (id, patch) =>
    set((state) => ({
      itineraries: state.itineraries.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),
}));
