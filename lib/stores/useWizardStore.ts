import { create } from 'zustand';
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

/** 당일치기인데 출발이 도착보다 빠르거나 같은 경우. "HH:mm"은 문자열 비교로 순서가 맞다. */
export function isSameDayTimeInverted(data: WizardData): boolean {
  return !!data.startDate && data.startDate === data.endDate
    && !!data.arrivalTime && !!data.departureTime && data.departureTime <= data.arrivalTime;
}

/** 4단계(예산·장소)는 선택이라 항상 유효하다. */
export function computeStepValid(step: number, data: WizardData): boolean {
  switch (step) {
    case 0: return data.destination.trim().length > 0 && !!data.startDate && !!data.endDate
      && !isSameDayTimeInverted(data);
    case 1: return data.themes.length >= 1 && data.categories.length >= 1;
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

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
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
}));
