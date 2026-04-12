'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import WizardLayout from '@/components/itinerary/wizard/WizardLayout';
import DestinationStep from '@/components/itinerary/wizard/steps/DestinationStep';
import ThemeStep from '@/components/itinerary/wizard/steps/ThemeStep';
import CategoryStep from '@/components/itinerary/wizard/steps/CategoryStep';
import PaceStep from '@/components/itinerary/wizard/steps/PaceStep';
import BudgetDateStep from '@/components/itinerary/wizard/steps/BudgetDateStep';
import DescriptionStep from '@/components/itinerary/wizard/steps/DescriptionStep';
import PlaceSelectStep from '@/components/itinerary/wizard/steps/PlaceSelectStep';
import SummaryStep from '@/components/itinerary/wizard/steps/SummaryStep';
import type { TripMode } from '@/lib/types/itinerary';

export default function PlanNewPage() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as TripMode) || 'auto';
  const { updateData, reset, data } = useWizardStore();

  useEffect(() => {
    if (data.mode !== mode) {
      reset();
      updateData({ mode });
    }
  }, [mode, data.mode, reset, updateData]);

  const steps = [
    <DestinationStep key="dest" />,
    <ThemeStep key="theme" />,
    <CategoryStep key="category" />,
    <PaceStep key="pace" />,
    <BudgetDateStep key="budget" />,
    ...(mode === 'manual'
      ? [<PlaceSelectStep key="place" />, <DescriptionStep key="desc" />]
      : []),
    <SummaryStep key="summary" />,
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <WizardLayout>{steps}</WizardLayout>
    </div>
  );
}
