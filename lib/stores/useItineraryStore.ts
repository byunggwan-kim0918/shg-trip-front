import { create } from 'zustand';
import type { Itinerary, ItinerarySummary } from '@/lib/types/itinerary';
import {
  fetchMyItineraries,
  selectAlternative,
} from '@/lib/data/itineraryService';

interface ItineraryState {
  currentItinerary: Itinerary | null;
  itineraries: ItinerarySummary[];
  selectedDay: number;
  selectedStepId: number | null;
  expandedStepId: number | null;
  isLoading: boolean;
  isSelectingAlternative: boolean;
  alternativeError: string | null;
  loadingProgress: number; // 0-100
}

interface ItineraryActions {
  setCurrentItinerary: (itinerary: Itinerary) => void;
  setSelectedDay: (day: number) => void;
  setSelectedStep: (stepId: number | null) => void;
  toggleExpandStep: (stepId: number) => void;
  /** 대안 선택 — 서버에 저장 후 응답으로 상태 갱신 */
  selectAlternativeStep: (itineraryId: number, stepId: number, alternativeId: number) => Promise<void>;
  clearAlternativeError: () => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  loadItineraries: () => Promise<void>;
}

export const useItineraryStore = create<ItineraryState & ItineraryActions>((set) => ({
  currentItinerary: null,
  itineraries: [],
  selectedDay: 1,
  selectedStepId: null,
  expandedStepId: null,
  isLoading: false,
  isSelectingAlternative: false,
  alternativeError: null,
  loadingProgress: 0,

  setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary, selectedDay: 1 }),

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

  loadItineraries: async () => {
    const page = await fetchMyItineraries();
    set({ itineraries: page.content });
  },
}));
