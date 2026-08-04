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
 * 같은 day 내 스텝을 새 순서로 낙관 재배정(백엔드 assignSlot과 동일).
 * 시간 슬롯 고정 — startTime/endTime은 위치(슬롯)에 고정되고 이동한 스텝이 그 위치의 시간을
 * 물려받는다(시간을 스텝에 붙여 옮기면 타임라인이 비단조로 보임). 교통정보는 서버 응답이 채운다.
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
  // 슬롯(위치)별 시간을 뮤테이션 전에 캡처: stepOrder → {startTime, endTime}
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
  /** 편집(재정렬·삭제) 진행 중 — 중복 요청 가드 */
  isEditingSteps: boolean;
  /** 편집 실패 안내(재정렬 롤백·삭제 실패) */
  stepError: string | null;
  loadingProgress: number; // 0-100
  /** story(가이드북 문장)가 비동기로 채워지는 중인지 — 상세 페이지 폴링이 제어 */
  storyPending: boolean;
}

interface ItineraryActions {
  setCurrentItinerary: (itinerary: Itinerary) => void;
  /** 폴링 갱신용 — 현재 보고 있는 day/확장 상태를 유지한 채 일정 데이터만 교체 */
  refreshCurrentItinerary: (itinerary: Itinerary) => void;
  /**
   * 비동기 채움(story notes·place.imageUrl·cover) 폴링 전용 머지.
   * 편집(재정렬/삭제)으로 바뀐 steps 순서·집합은 보존하고, id가 일치하는 스텝의 채움 필드만 덮어쓴다.
   * → 폴링의 stale 응답이 편집 결과를 되돌리는 레이스를 원천 차단한다.
   */
  applyAsyncFill: (fresh: Itinerary) => void;
  setSelectedDay: (day: number) => void;
  setSelectedStep: (stepId: number | null) => void;
  toggleExpandStep: (stepId: number) => void;
  /** 대안 선택 — 서버에 저장 후 응답으로 상태 갱신 */
  selectAlternativeStep: (itineraryId: number, stepId: number, alternativeId: number) => Promise<void>;
  clearAlternativeError: () => void;
  /** 같은 day 내 스텝 재정렬 — 낙관 반영 후 서버 확정, 실패 시 스냅샷 롤백 */
  reorderStepsAction: (itineraryId: number, dayNumber: number, orderedStepIds: number[]) => Promise<void>;
  /** 스텝(스톱) 삭제 — 서버 확정 후 응답으로 갱신 */
  deleteStepAction: (itineraryId: number, stepId: number) => Promise<void>;
  clearStepError: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setStoryPending: (pending: boolean) => void;
  loadItineraries: (size?: number) => Promise<void>;
  /** 일정 삭제 — 서버 soft delete 후 목록 재조회. 중복 클릭은 isDeleting으로 무시 */
  removeItinerary: (id: number) => Promise<void>;
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
      // 다른 일정이거나 아직 없음 → 그대로 채택(머지할 기준 없음)
      if (!cur || cur.id !== fresh.id) return { currentItinerary: fresh };
      const freshById = new Map(fresh.steps.map((s) => [s.id, s]));
      const steps = cur.steps.map((s) => {
        const f = freshById.get(s.id);
        if (!f) return s; // 편집으로 삭제된/추가된 스텝은 현재 상태 유지
        // 비동기로 채워지는 필드만 덮어씀 — 순서(stepOrder)·시간·교통은 현재(편집 반영) 값 보존
        const place =
          s.place && f.place ? { ...s.place, imageUrl: f.place.imageUrl ?? s.place.imageUrl } : s.place;
        return { ...s, notes: f.notes ?? s.notes, place };
      });
      return { currentItinerary: { ...cur, coverImage: fresh.coverImage ?? cur.coverImage, steps } };
    }),

  setSelectedDay: (day) => set({ selectedDay: day, selectedStepId: null }),

  setSelectedStep: (stepId) => set({ selectedStepId: stepId }),

  toggleExpandStep: (stepId) =>
    set((state) => ({
      expandedStepId: state.expandedStepId === stepId ? null : stepId,
    })),

  selectAlternativeStep: async (itineraryId, stepId, alternativeId) => {
    // 중복 요청 방지: 이미 처리 중이면 무시
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
    // 낙관 반영: 드래그 결과를 즉시 화면에 (교통정보는 서버 응답이 채움)
    set({
      isEditingSteps: true,
      stepError: null,
      currentItinerary: reorderStepsLocally(snapshot, dayNumber, orderedStepIds),
    });
    try {
      const updated = await reorderSteps(itineraryId, dayNumber, orderedStepIds);
      set({ currentItinerary: updated });
    } catch (e) {
      // 실패 → 스냅샷 롤백 + 안내
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
      // 목록 로드 실패는 조용히 무시(호출부가 UI 에러를 별도 처리). unhandled rejection 방지.
    } finally {
      set({ isLoading: false });
    }
  },

  removeItinerary: async (id) => {
    // 중복 클릭 방지: 이미 삭제 처리 중이면 무시
    if (useItineraryStore.getState().isDeleting) return;
    set({ isDeleting: true });
    try {
      await deleteItinerary(id);
      // 삭제 성공 → 즉시 로컬 목록에서 제거 (재조회 실패와 무관하게 반영)
      set((state) => ({ itineraries: state.itineraries.filter((it) => it.id !== id) }));
      // 재조회는 best-effort — 실패해도 삭제 성공을 되돌리지 않는다
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
}));
