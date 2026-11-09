import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WizardData } from '@/lib/types/itinerary';

// 0 여행지·기간 → 1 취향(테마+카테고리) → 2 스타일(페이스+이동) → 3 예산·필수장소(선택) → 4 확인
const TOTAL_STEPS = 5;

const initialData: WizardData = {
  destination: '',
  themes: [],
  categories: [],
  pace: 'normal',
  transportPref: 'any',
  budget: null,
  companion: null,
  partySize: null,
  arrivalTime: null,
  departureTime: null,
  startDate: null,
  endDate: null,
  description: '',
  selectedPlaces: [],
};

/** 테마·카테고리 각각의 서버 상한(ItineraryGenerateRequest @Size)과 같다. */
export const MAX_TASTE_SELECTIONS = 10;

/** 서버는 종료일이 시작일보다 뒤여야 받는다. "YYYY-MM-DD"는 문자열 비교로 순서가 맞다. */
export function isInvalidRange(data: WizardData): boolean {
  return !!data.startDate && !!data.endDate && data.endDate <= data.startDate;
}

/** 4단계(예산·장소)는 선택이라 항상 유효하다. */
export function computeStepValid(step: number, data: WizardData): boolean {
  switch (step) {
    case 0: return data.destination.trim().length > 0 && !!data.startDate && !!data.endDate
      && !isInvalidRange(data);
    case 1: return data.themes.length >= 1 && data.categories.length >= 1
      && data.themes.length <= MAX_TASTE_SELECTIONS && data.categories.length <= MAX_TASTE_SELECTIONS;
    case 2: return true;  // 페이스·이동은 기본값이 있다
    case 3: return true;  // 선택·건너뛰기 가능
    case 4: return true;
    default: return true;
  }
}

interface WizardState {
  currentStep: number;
  data: WizardData;
  isStepValid: boolean;
}

interface WizardActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<WizardData>) => void;
  setStepValid: (valid: boolean) => void;
  reset: () => void;
  getTotalSteps: () => number;
}

// 새로고침해도 입력이 남게 탭 단위로 저장한다. 복원은 마법사 페이지가 새로고침일 때만 rehydrate로 한다.
export const useWizardStore = create<WizardState & WizardActions>()(persist((set, get) => ({
  currentStep: 0,
  data: initialData,
  isStepValid: false,

  getTotalSteps: () => TOTAL_STEPS,

  setStep: (step) => {
    const clamped = Math.max(0, Math.min(step, TOTAL_STEPS - 1));
    const { data } = get();
    set({ currentStep: clamped, isStepValid: computeStepValid(clamped, data) });
  },

  nextStep: () => {
    const { currentStep, isStepValid, data } = get();
    if (!isStepValid) return;
    if (currentStep < TOTAL_STEPS - 1) {
      const next = currentStep + 1;
      set({ currentStep: next, isStepValid: computeStepValid(next, data) });
    }
  },

  prevStep: () => {
    const { currentStep, data } = get();
    if (currentStep > 0) {
      const prev = currentStep - 1;
      set({ currentStep: prev, isStepValid: computeStepValid(prev, data) });
    }
  },

  updateData: (partial) =>
    set((state) => {
      const newData = { ...state.data, ...partial };
      return { data: newData, isStepValid: computeStepValid(state.currentStep, newData) };
    }),

  setStepValid: (valid) => set({ isStepValid: valid }),

  reset: () => set({ currentStep: 0, data: initialData, isStepValid: false }),
}), {
  name: 'shg.wizard',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({ currentStep: state.currentStep, data: state.data }),
  // 배포로 WizardData에 필드가 늘면 옛 저장값에는 그 필드가 없다.
  merge: (persisted, current) => {
    const saved = persisted as Partial<WizardState> | undefined;
    return { ...current, ...saved, data: { ...initialData, ...saved?.data } };
  },
  version: 1,
  skipHydration: true,
}));
