'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { groupStepsByDay } from '@/lib/types/itinerary';
import type { ItineraryStep } from '@/lib/types/itinerary';
import { formatBudget, UNREALISTIC_LEG_KM } from '@/lib/utils/format';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { finalizeItinerary } from '@/lib/data/itineraryService';
import TimelinePanel from './TimelinePanel';
import MapPanel from './MapPanel';

function getDuration(start: string, end: string) {
  const n = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return `${n}박 ${n + 1}일`;
}

function toMinutes(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** 같은 날 안에서 시작 시각이 이전 스텝보다 빨라지는(역행) 이상이 있는지 판정 */
function hasTimeAnomaly(steps: ItineraryStep[]): boolean {
  const byDay = new Map<number, ItineraryStep[]>();
  for (const s of steps) {
    const list = byDay.get(s.dayNumber) ?? [];
    list.push(s);
    byDay.set(s.dayNumber, list);
  }
  for (const daySteps of byDay.values()) {
    const ordered = [...daySteps].sort((a, b) => a.stepOrder - b.stepOrder);
    let prevEnd: number | null = null;
    for (const s of ordered) {
      const start = toMinutes(s.startTime);
      if (start != null && prevEnd != null && start < prevEnd) return true;
      const end = toMinutes(s.endTime);
      if (end != null) prevEnd = end;
    }
  }
  return false;
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

  const { destination, startDate, endDate, totalBudget, coverImage, tags } = currentItinerary;
  const dayGroups = groupStepsByDay(currentItinerary.steps);
  const currentGroup = dayGroups.find((g) => g.dayNumber === selectedDay) ?? dayGroups[0];

  // 예산 대비 추정 총액 = 장소 비용 + 이동 비용 (대안 선택 시 실시간 반영되도록 steps에서 합산).
  // 이동비를 빼면 렌터카/택시 여행의 실제 지출이 과소 표시돼 여행자가 예산을 오판한다.
  const estimatedTotal = currentItinerary.steps.reduce(
    (sum, s) => sum + (s.estimatedCost ?? 0) + (s.transportationCost ?? 0), 0);
  const budgetPct = totalBudget && totalBudget > 0
    ? Math.round((estimatedTotal / totalBudget) * 100)
    : null;
  const overBudget = budgetPct != null && budgetPct > 100;

  // 이상 데이터 감지 (사용자에게 즉시 인지시키기 위한 경고)
  const timeAnomaly = hasTimeAnomaly(currentItinerary.steps);
  const unrealisticLeg = currentItinerary.steps.some(
    (s) => s.transportationDistance != null && s.transportationDistance > UNREALISTIC_LEG_KM,
  );
  // 커버 이미지: 유효한 절대 URL(S3)일 때만 coverImage 사용.
  // 과거 데이터의 깨진 상대경로(/api/places/{id}/photo)나 생성 직후 null이면 첫 스텝 imageUrl로 폴백
  // (스텝 사진과 동일 경로 → 비동기 업로드 폴링과 함께 채워짐).
  const validCover = coverImage && /^https?:\/\//.test(coverImage) ? coverImage : null;
  const firstStepImage = currentItinerary.steps.find((s) => s.place?.imageUrl)?.place?.imageUrl ?? null;
  const cover = proxyImageUrl(validCover ?? firstStepImage);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* SummaryHeader */}
      <div className="px-4 py-3 border-b border-card-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={currentItinerary.title ?? destination}
              className="hidden sm:block w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {currentItinerary.title ?? destination}
            </h1>
            <p className="text-sm text-muted">
              {startDate} ~ {endDate} ({getDuration(startDate, endDate)})
              {totalBudget != null && (
                <span className={overBudget ? 'text-red-500 font-medium' : undefined}>
                  {' · 예상 '}{formatBudget(estimatedTotal)}원 / 예산 {formatBudget(totalBudget)}원
                  {budgetPct != null && ` (${budgetPct}%)`}
                </span>
              )}
              {totalBudget == null && estimatedTotal > 0 && ` · 예상 ${formatBudget(estimatedTotal)}원`}
            </p>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[11px] bg-surface text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
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

      {(timeAnomaly || unrealisticLeg) && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            일부 장소의 위치·시간 정보가 정확하지 않을 수 있어요.
            {timeAnomaly && ' 일정 시간 순서를 확인해 주세요.'}
            {unrealisticLeg && ' 이동 거리가 비정상적으로 큰 구간이 있어요.'}
            {' '}대안 선택으로 다른 장소로 바꿀 수 있어요.
          </span>
        </div>
      )}

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
            steps={currentItinerary.steps}
            selectedDay={selectedDay}
            selectedStepId={selectedStepId}
            onMarkerClick={setSelectedStep}
          />
        </div>
      </div>
    </div>
  );
}
