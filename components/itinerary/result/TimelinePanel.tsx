'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

function SortableStepCard({
  step,
  index,
  itineraryId,
  onStepClick,
}: {
  step: ItineraryStep;
  index: number;
  itineraryId: number;
  onStepClick: (stepId: number) => void;
}) {
  const { expandedStepId, toggleExpandStep, selectAlternativeStep, isSelectingAlternative, alternativeError, clearAlternativeError } = useItineraryStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  const handleSelectAlternative = async (alt: AlternativeOption) => {
    clearAlternativeError();
    await selectAlternativeStep(itineraryId, step.id, alt.id);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <StepCard
        step={step}
        index={index}
        isExpanded={expandedStepId === step.id}
        onToggleExpand={() => toggleExpandStep(step.id)}
        onClick={() => onStepClick(step.id)}
        onSelectAlternative={isSelectingAlternative ? undefined : handleSelectAlternative}
        dragListeners={listeners}
      />
      {alternativeError && expandedStepId === step.id && (
        <p className="text-xs text-red-500 mt-1 px-3">{alternativeError}</p>
      )}
    </div>
  );
}

export default function TimelinePanel({
  itinerary,
  selectedDay,
  onDayChange,
  onStepClick,
}: TimelinePanelProps) {
  const dayGroups: DayGroup[] = groupStepsByDay(itinerary.steps);
  const currentGroup = dayGroups.find((g) => g.dayNumber === selectedDay) ?? dayGroups[0];

  // DnD는 현재 UI 전용 (순서 변경 서버 저장은 PUT /api/itineraries/{id} 필요 — 추후 구현)
  const handleDragEnd = (_event: DragEndEvent) => {
    // TODO: 순서 변경 후 PUT /api/itineraries/{id} 호출
  };

  if (!currentGroup) return null;

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

      {/* Steps with DnD — key로 day 전환 시 즉시 리마운트 */}
      <DndContext key={currentGroup.dayNumber} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={currentGroup.steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {currentGroup.steps.map((step, idx) => (
              <div key={step.id}>
                <SortableStepCard
                  step={step}
                  index={idx}
                  itineraryId={itinerary.id}
                  onStepClick={onStepClick}
                />
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
        </SortableContext>
      </DndContext>
    </div>
  );
}
