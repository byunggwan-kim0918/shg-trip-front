'use client';

import { Coffee, Route } from 'lucide-react';
import type { AlternativeOption, DayGroup, Itinerary, ItineraryStep } from '@/lib/types/itinerary';
import { groupStepsByDay } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { formatDuration } from '@/lib/utils/format';
import StepCard from './StepCard';
import TransitInfo from './TransitInfo';

const FREE_TIME_THRESHOLD_MIN = 90;

interface TimelinePanelProps {
  itinerary: Itinerary;
  selectedDay: number;  // dayNumber (1-indexed)
  onDayChange: (dayNumber: number) => void;
  onStepClick: (stepId: number) => void;
}

function toMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** 이전 스텝 종료 → 다음 스텝 시작 사이의 빈 시간(이동시간 제외, 분). */
function freeGapMinutes(prev: ItineraryStep, next: ItineraryStep): number {
  const end = toMinutes(prev.endTime);
  const start = toMinutes(next.startTime);
  if (end == null || start == null) return 0;
  return start - end - (next.transportationDuration ?? 0);
}

function formatGap(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
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

  // 하루 총 이동 거리/시간 (스텝별 transport 합산)
  const totalDistanceKm = currentGroup.steps.reduce(
    (sum, s) => sum + (s.transportationDistance ?? 0), 0);
  const totalTransitMin = currentGroup.steps.reduce(
    (sum, s) => sum + (s.transportationDuration ?? 0), 0);

  return (
    <div className="p-4">
      {/* Day 탭 */}
      <div className="flex gap-2 mb-2 overflow-x-auto" role="tablist">
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

      {/* 하루 이동 요약 배지 */}
      {totalDistanceKm > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted">
          <Route size={13} aria-hidden="true" />
          <span>
            총 이동 {totalDistanceKm.toFixed(1)}km
            {totalTransitMin > 0 && ` · ${formatDuration(totalTransitMin)}`}
          </span>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-1">
        {currentGroup.steps.map((step, idx) => (
          <div key={step.id}>
            {/* 첫 스텝: 숙소(또는 전날 위치)에서 출발하는 이동 정보 */}
            {idx === 0 && step.transportationMode && (
              <div className="flex items-center gap-2 pb-2 px-8 text-xs text-muted">
                <span>🏨 숙소에서 출발</span>
                {step.transportationDuration != null && (
                  <span>{formatDuration(step.transportationDuration)}</span>
                )}
                {step.transportationDistance != null && (
                  <span>({step.transportationDistance.toFixed(1)}km)</span>
                )}
              </div>
            )}
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
            {/* 다음 step까지의 교통 정보 + 큰 공백은 자유시간으로 표시 */}
            {idx < currentGroup.steps.length - 1 && (() => {
              const next = currentGroup.steps[idx + 1];
              const gap = freeGapMinutes(step, next);
              return (
                <>
                  {gap >= FREE_TIME_THRESHOLD_MIN && (
                    <div className="flex items-center gap-2 my-1 mx-8 px-3 py-2 rounded-lg border border-dashed border-card-border text-xs text-muted bg-surface/50">
                      <Coffee size={13} aria-hidden="true" />
                      <span>자유시간 약 {formatGap(gap)} — 주변을 자유롭게 둘러보세요</span>
                    </div>
                  )}
                  {next.transportationMode ? (
                    <TransitInfo
                      mode={next.transportationMode}
                      duration={next.transportationDuration}
                      distance={next.transportationDistance}
                    />
                  ) : null}
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
