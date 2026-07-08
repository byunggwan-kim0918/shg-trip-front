import { create } from 'zustand';
import type { Itinerary, ItinerarySummary } from '@/lib/types/itinerary';
import {
  fetchMyItineraries,
  selectAlternative,
  deleteItinerary,
} from '@/lib/data/itineraryService';

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
  loadingProgress: number; // 0-100
  /** story(가이드북 문장)가 비동기로 채워지는 중인지 — 상세 페이지 폴링이 제어 */
  storyPending: boolean;
}

interface ItineraryActions {
  setCurrentItinerary: (itinerary: Itinerary) => void;
  /** 폴링 갱신용 — 현재 보고 있는 day/확장 상태를 유지한 채 일정 데이터만 교체 */
  refreshCurrentItinerary: (itinerary: Itinerary) => void;
  setSelectedDay: (day: number) => void;
  setSelectedStep: (stepId: number | null) => void;
  toggleExpandStep: (stepId: number) => void;
  /** 대안 선택 — 서버에 저장 후 응답으로 상태 갱신 */
  selectAlternativeStep: (itineraryId: number, stepId: number, alternativeId: number) => Promise<void>;
  clearAlternativeError: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setStoryPending: (pending: boolean) => void;
  loadItineraries: () => Promise<void>;
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
  loadingProgress: 0,
  storyPending: false,

  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary, selectedDay: 1 }),

  refreshCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),

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

  setLoading: (loading) => set({ isLoading: loading }),

  clearAlternativeError: () => set({ alternativeError: null }),

  setLoadingProgress: (progress) => set({ loadingProgress: Math.max(0, Math.min(100, progress)) }),

  setStoryPending: (pending) => set({ storyPending: pending }),

  loadItineraries: async () => {
    const page = await fetchMyItineraries();
    set({ itineraries: page.content });
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
