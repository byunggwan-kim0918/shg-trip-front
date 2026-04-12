import { create } from 'zustand';
import type { WizardData } from '@/lib/types/itinerary';
// WizardData.selectedPlaces는 WizardPlace[] (id: number 기반)

const STEPS_AUTO = 6;   // 여행지 → 테마 → 카테고리 → 페이스 → 예산/기간 → 요약
const STEPS_MANUAL = 8; // 여행지 → 테마 → 카테고리 → 페이스 → 예산/기간 → 장소선택 → 부가설명 → 요약

const initialData: WizardData = {
  mode: 'auto',
  destination: '',
  themes: [],
  categories: [],
  pace: 'normal',
  budget: null,
  startDate: null,
  endDate: null,
  description: '',
  selectedPlaces: [],
};

// 각 단계의 유효성을 데이터 기반으로 동기적으로 계산
export function computeStepValid(step: number, data: WizardData): boolean {
  switch (step) {
    case 0: return data.destination.trim().length > 0;
    case 1: return data.themes.length >= 1;
    case 2: return data.categories.length >= 1;
    case 3: return true; // 페이스 (기본값 있으므로 항상 유효)
    case 4: return !!data.startDate && !!data.endDate;
    case 5:
      // auto: 요약(항상 유효), manual: 장소선택
      if (data.mode === 'manual') return data.selectedPlaces.length >= 1;
      return true;
    case 6:
      // manual: 부가설명(선택)
      return true;
    case 7:
      return true; // manual 요약
    default:
      return true;
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

  getTotalSteps: () => (get().data.mode === 'manual' ? STEPS_MANUAL : STEPS_AUTO),

  setStep: (step) => {
    const total = get().getTotalSteps();
    const clamped = Math.max(0, Math.min(step, total - 1));
    const { data } = get();
    set({ currentStep: clamped, isStepValid: computeStepValid(clamped, data) });
  },

  nextStep: () => {
    const { currentStep, isStepValid, getTotalSteps, data } = get();
    if (!isStepValid) return;
    const total = getTotalSteps();
    if (currentStep < total - 1) {
      const nextStep = currentStep + 1;
      set({ currentStep: nextStep, isStepValid: computeStepValid(nextStep, data) });
    }
  },

  prevStep: () => {
    const { currentStep, data } = get();
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      set({ currentStep: prevStep, isStepValid: computeStepValid(prevStep, data) });
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
