'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { NEW_TRIP_SENTENCE_KEY } from '@/lib/constants/newTrip';
import NewTripShell from '@/components/itinerary/NewTripShell';
import WizardLayout from '@/components/itinerary/wizard/WizardLayout';
import TripBasicsStep from '@/components/itinerary/wizard/steps/TripBasicsStep';
import TasteStep from '@/components/itinerary/wizard/steps/TasteStep';
import StyleStep from '@/components/itinerary/wizard/steps/StyleStep';
import BudgetPlacesStep from '@/components/itinerary/wizard/steps/BudgetPlacesStep';
import ConfirmStep from '@/components/itinerary/wizard/steps/ConfirmStep';

/**
 * 통합 새 여행 진입점.
 * - `?builder=1` 없음 → NewTripShell(자연어 입력).
 * - `?builder=1` → 5단계 마법사(자동/수동 모드 분리 폐지, 장소 단계는 선택).
 */
export default function PlanNewPage() {
  const searchParams = useSearchParams();
  const builder = searchParams.get('builder') === '1';
  const { reset } = useWizardStore();

  // 마법사 진입 시 초기화 + 자연어 문장을 description 프리필.
  useEffect(() => {
    if (!builder) return;
    reset();
    const sentence = sessionStorage.getItem(NEW_TRIP_SENTENCE_KEY);
    if (sentence) {
      sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
      useWizardStore.getState().updateData({ description: sentence });
    }
  }, [builder, reset]);

  if (!builder) {
    return <NewTripShell />;
  }

  const steps = [
    <TripBasicsStep key="basics" />,
    <TasteStep key="taste" />,
    <StyleStep key="style" />,
    <BudgetPlacesStep key="budget" />,
    <ConfirmStep key="confirm" />,
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <WizardLayout optionalSteps={[3]}>{steps}</WizardLayout>
    </div>
  );
}
