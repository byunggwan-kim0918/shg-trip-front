'use client';

import type { AlternativeOption, DayGroup, Itinerary, ItineraryStep } from '@/lib/types/itinerary';
import { groupStepsByDay } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import StepCard from './StepCard';
import TransitInfo from './TransitInfo';

interface TimelinePanelProps {
  itinerary: Itinerary;
  selectedDay: number;  // dayNumber (1-indexed)
  onDayChange: (dayNumber: number) => void;
  onStepClick: (stepId: number) => void;
}

export default function TimelinePanel({
  itinerary,
  selectedDay,
  onDayChange,
  onStepClick,
}: TimelinePanelProps) {
  const { expandedStepId, toggleExpandStep, selectAlternativeStep, isSelectingAlternative, alternativeError, clearAlternativeError } = useItineraryStore();
  const dayGroups: DayGroup[] = groupStepsByDay(itinerary.steps);
  const currentGroup = dayGroups.find((g) => g.dayNumber === selectedDay) ?? dayGroups[0];

  if (!currentGroup) return null;

  const handleSelectAlternative = async (step: ItineraryStep, alt: AlternativeOption) => {
    clearAlternativeError();
    await selectAlternativeStep(itinerary.id, step.id, alt.id);
  };

  return (
    <div className="p-4">
      {/* Day 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto" role="tablist">
        {dayGroups.map((group) => (
          <button
            key={group.dayNumber}
            role="tab"
            aria-selected={group.dayNumber === selectedDay}
            onClick={() => onDayChange(group.dayNumber)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors
              ${group.dayNumber === selectedDay
                ? 'bg-accent text-white'
                : 'bg-surface text-foreground hover:bg-surface-hover'
              }
            `}
          >
            Day {group.dayNumber}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {currentGroup.steps.map((step, idx) => (
          <div key={step.id}>
            <StepCard
              step={step}
              index={idx}
              isExpanded={expandedStepId === step.id}
              onToggleExpand={() => toggleExpandStep(step.id)}
              onClick={() => onStepClick(step.id)}
              onSelectAlternative={isSelectingAlternative ? undefined : (alt) => handleSelectAlternative(step, alt)}
            />
            {alternativeError && expandedStepId === step.id && (
              <p className="text-xs text-red-500 mt-1 px-3">{alternativeError}</p>
            )}
            {/* 다음 step의 교통 정보 표시 */}
            {idx < currentGroup.steps.length - 1 && (() => {
              const next = currentGroup.steps[idx + 1];
              return next.transportationMode ? (
                <TransitInfo
                  mode={next.transportationMode}
                  duration={next.transportationDuration}
                  distance={next.transportationDistance}
                />
              ) : null;
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
