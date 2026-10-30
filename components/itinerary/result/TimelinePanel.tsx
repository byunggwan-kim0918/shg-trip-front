'use client';

import { BedDouble, Coffee, ArrowLeftRight, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { AlternativeOption, DayGroup, Itinerary, ItineraryStep } from '@/lib/types/itinerary';
import { groupStepsByDay } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { formatDuration } from '@/lib/utils/format';
import { parseQualityNotices } from '@/lib/utils/qualityNotices';
import StepCard from './StepCard';
import SortableStepCard from './SortableStepCard';
import TransitInfo from './TransitInfo';
import QualityNotices from './QualityNotices';

const FREE_TIME_THRESHOLD_MIN = 90;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface TimelinePanelProps {
  itinerary: Itinerary;
  selectedDay: number;  // dayNumber (1-indexed)
  onDayChange: (dayNumber: number) => void;
  onStepClick: (stepId: number) => void;
  /** 편집 모드(F3): 같은 day 내 드래그 재정렬 + 스톱 삭제 활성화. */
  editMode?: boolean;
  /** 스톱 삭제 요청 — 상위(ResultLayout)가 ConfirmModal로 처리. */
  onRequestDeleteStep?: (step: ItineraryStep) => void;
  /** 읽기 전용(공유 공개 뷰·확정된 일정): 대안 선택·편집힌트 비활성, StepCard readOnly. */
  readOnly?: boolean;
  /** 품질 알림 원문. 걸린 Day 탭에는 점을, 선택된 Day에는 그날 항목을 보인다.
   *  공유 공개 뷰는 넘기지 않는다 — 보는 사람이 고칠 수 없는 정보다. */
  qualityNotices?: string[];
}

function toMinutes(hhmm: string | null): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

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

/** dayNumber(1-base)로 해당 날짜 "M.D (요일)" 계산. */
function dayDateLabel(startDate: string, dayNumber: number): string | null {
  const base = new Date(startDate);
  if (Number.isNaN(base.getTime())) return null;
  const d = new Date(base);
  d.setDate(base.getDate() + (dayNumber - 1));
  return `${d.getMonth() + 1}.${d.getDate()} (${WEEKDAYS[d.getDay()]})`;
}

export default function TimelinePanel({
  itinerary,
  selectedDay,
  onDayChange,
  onStepClick,
  editMode = false,
  onRequestDeleteStep,
  readOnly = false,
  qualityNotices = [],
}: TimelinePanelProps) {
  // alternativeError는 ResultLayout의 Toast에서 표시하므로 여기선 구독하지 않는다.
  const { expandedStepId, toggleExpandStep, selectAlternativeStep, isSelectingAlternative,
    clearAlternativeError, reorderStepsAction, isEditingSteps } = useItineraryStore();
  const dayGroups: DayGroup[] = groupStepsByDay(itinerary.steps);
  const currentGroup = dayGroups.find((g) => g.dayNumber === selectedDay) ?? dayGroups[0];

  // 드래그 센서: 6px 이동해야 드래그 시작(카드 클릭/스크롤과 구분) + 키보드 접근성.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!currentGroup) return null;

  const handleSelectAlternative = async (step: ItineraryStep, alt: AlternativeOption) => {
    clearAlternativeError();
    await selectAlternativeStep(itinerary.id, step.id, alt.id);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = currentGroup.steps.map((s) => s.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    // 같은 day 내에서만 재정렬 (Property 22: same-day only)
    reorderStepsAction(itinerary.id, currentGroup.dayNumber, arrayMove(ids, oldIndex, newIndex));
  };

  const totalDistanceKm = currentGroup.steps.reduce((sum, s) => sum + (s.transportationDistance ?? 0), 0);
  const totalTransitMin = currentGroup.steps.reduce((sum, s) => sum + (s.transportationDuration ?? 0), 0);
  const dateLabel = dayDateLabel(itinerary.startDate, currentGroup.dayNumber);
  const { items: noticeItems, days: warnDays } = parseQualityNotices(qualityNotices);
  // 일차를 못 읽은 원문은 어느 날에 속하는지 모르므로 모든 Day에 보인다.
  const dayNotices = noticeItems.filter((n) => n.day === currentGroup.dayNumber || n.day == null);

  return (
    <div className="p-4 sm:p-5">
      {/* Day 탭 */}
      <div className="mb-3.5 flex gap-2 overflow-x-auto" role="tablist">
        {dayGroups.map((group) => {
          const active = group.dayNumber === selectedDay;
          const warned = warnDays.includes(group.dayNumber);
          return (
            <button
              key={group.dayNumber}
              role="tab"
              aria-selected={active}
              onClick={() => onDayChange(group.dayNumber)}
              /* 활성에도 border를 둔다(transparent). 없으면 활성/비활성 높이가 보더 1px만큼
                 달라서 탭 줄이 미세하게 들썩였다. */
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-[10px] border px-5 py-2 text-sm font-bold transition-colors ${
                active
                  ? 'border-transparent bg-accent text-accent-fg'
                  : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
              }`}
            >
              Day {group.dayNumber}
              {warned && (
                <span
                  className={`h-[5px] w-[5px] shrink-0 rounded-full ${active ? 'bg-accent-fg/70' : 'bg-warn-fg'}`}
                  aria-label="확인할 점 있음"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 하루 요약 + 편집 힌트 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] font-semibold text-muted">
        {totalDistanceKm > 0 && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeftRight size={13} className="text-accent-weak-fg" aria-hidden="true" /> 총 이동 <span className="tabular-nums">{totalDistanceKm.toFixed(1)}km</span>
            </span>
            {totalTransitMin > 0 && (
              <>
                <span className="h-[3px] w-[3px] rounded-full bg-muted-2" />
                <span>이동 {formatDuration(totalTransitMin)}</span>
              </>
            )}
          </>
        )}
        {dateLabel && (
          <>
            {totalDistanceKm > 0 && <span className="h-[3px] w-[3px] rounded-full bg-muted-2" />}
            <span>{dateLabel}</span>
          </>
        )}
        {editMode && !readOnly && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-accent-weak-fg">
            <GripVertical size={13} aria-hidden="true" /> 끌어서 순서 변경 · 휴지통으로 삭제
          </span>
        )}
      </div>

      <QualityNotices items={dayNotices} />

      {/* 편집 모드: 같은 day 내 드래그 재정렬 + 삭제 (단순 리스트) */}
      {editMode && !readOnly ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={currentGroup.steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentGroup.steps.map((step) => (
              <SortableStepCard
                key={step.id}
                step={step}
                disabled={isEditingSteps}
                deletable={currentGroup.steps.length > 1}
                onRequestDelete={() => onRequestDeleteStep?.(step)}
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
      /* 일반 타임라인 */
      <div>
        {currentGroup.steps.map((step, idx) => {
          const isLast = idx === currentGroup.steps.length - 1;
          const next = isLast ? null : currentGroup.steps[idx + 1];
          const gap = next ? freeGapMinutes(step, next) : 0;
          return (
            <div key={step.id} className="flex gap-3.5">
              {/* 번호 노드 + 연결선 */}
              <div className="flex flex-col items-center">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                  {idx + 1}
                </span>
                {/* 번호 배지와 같은 계열로. card-border(#e6e9ef)는 캔버스(#eef0f4) 위에서
                    거의 보이지 않아 레일이 끊겨 보였다(divider는 더 연하므로 답이 아니다). */}
                {!isLast && <span className="my-1.5 w-0.5 flex-1 rounded-full bg-accent/25" />}
              </div>

              {/* 카드 + 커넥터 */}
              <div className="min-w-0 flex-1 pb-2">
                {/* 첫 스텝 숙소 출발 힌트 */}
                {idx === 0 && step.transportationMode && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-2">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble size={12} aria-hidden="true" /> 숙소에서 출발
                    </span>
                    {step.transportationDuration != null && <span>{formatDuration(step.transportationDuration)}</span>}
                    {step.transportationDistance != null && <span>({step.transportationDistance.toFixed(1)}km)</span>}
                  </div>
                )}

                <StepCard
                  step={step}
                  isExpanded={expandedStepId === step.id}
                  onToggleExpand={() => toggleExpandStep(step.id)}
                  onClick={() => onStepClick(step.id)}
                  onSelectAlternative={readOnly || isSelectingAlternative ? undefined : (alt) => handleSelectAlternative(step, alt)}
                  readOnly={readOnly}
                />

                {/* 다음 스텝까지 이동 커넥터 + 자유시간 */}
                {next && (
                  <>
                    {/* 채움을 두지 않는다. surface-2(#fbfbfd)는 card-bg(#ffffff)와 거의 같아서
                        스톱이 흰 행이 된 뒤로는 자유시간이 스톱처럼 보인다.
                        점선 테두리만 캔버스 위에 둬서 "여기는 비어 있다"로 읽히게 한다. */}
                    {gap >= FREE_TIME_THRESHOLD_MIN && (
                      <div className="my-2 flex items-center gap-2 rounded-[10px] border border-dashed border-card-border px-3 py-2 text-xs text-muted">
                        <Coffee size={13} aria-hidden="true" />
                        <span>자유시간 약 {formatGap(gap)}. 주변을 자유롭게 둘러보세요</span>
                      </div>
                    )}
                    {next.transportationMode && (
                      <TransitInfo
                        mode={next.transportationMode}
                        duration={next.transportationDuration}
                        distance={next.transportationDistance}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
