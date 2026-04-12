'use client';

import { useState } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { groupStepsByDay } from '@/lib/types/itinerary';
import { formatBudget } from '@/lib/utils/format';
import { finalizeItinerary } from '@/lib/data/itineraryService';
import TimelinePanel from './TimelinePanel';
import MapPanel from './MapPanel';

function getDuration(start: string, end: string) {
  const n = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return `${n}박 ${n + 1}일`;
}

export default function ResultLayout() {
  const { currentItinerary, selectedDay, selectedStepId, setSelectedDay, setSelectedStep, setCurrentItinerary } =
    useItineraryStore();
  const [showMap, setShowMap] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  if (!currentItinerary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">일정을 찾을 수 없습니다</p>
      </div>
    );
  }

  const { destination, startDate, endDate, totalBudget } = currentItinerary;
  const dayGroups = groupStepsByDay(currentItinerary.steps);
  const currentGroup = dayGroups.find((g) => g.dayNumber === selectedDay) ?? dayGroups[0];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* SummaryHeader */}
      <div className="px-4 py-3 border-b border-card-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            {currentItinerary.title ?? destination}
          </h1>
          <p className="text-sm text-muted">
            {startDate} ~ {endDate} ({getDuration(startDate, endDate)})
            {totalBudget != null && ` · ${formatBudget(totalBudget)}원`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentItinerary.status === 'DRAFT' && (
            <button
              type="button"
              disabled={finalizing}
              onClick={async () => {
                setFinalizing(true);
                try {
                  const updated = await finalizeItinerary(currentItinerary.id);
                  setCurrentItinerary(updated);
                } catch { /* 에러 무시 — 이미 확정된 경우 등 */ }
                setFinalizing(false);
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[36px]"
            >
              {finalizing ? '확정 중...' : '✓ 일정 확정'}
            </button>
          )}
          {currentItinerary.status === 'FINALIZED' && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              확정됨
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium border border-card-border bg-card-bg text-foreground hover:bg-surface-hover transition-colors min-h-[36px]"
          >
            {showMap ? '지도 숨기기' : '지도 보기'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <div className={`${showMap ? 'lg:w-[55%]' : 'w-full'} w-full overflow-y-auto`}>
          <TimelinePanel
            itinerary={currentItinerary}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onStepClick={setSelectedStep}
          />
        </div>
        <div
          className={`
            lg:block lg:w-[45%] w-full overflow-hidden
            ${showMap ? 'block' : 'hidden lg:block'}
          `}
          style={{ minHeight: showMap ? '300px' : undefined }}
        >
          <MapPanel
            key={selectedDay}
            steps={currentGroup?.steps ?? []}
            selectedStepId={selectedStepId}
            onMarkerClick={setSelectedStep}
          />
        </div>
      </div>
    </div>
  );
}
