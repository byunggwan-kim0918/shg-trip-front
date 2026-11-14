'use client';

import { BedDouble, Car, Coffee, ArrowLeftRight, GripVertical, Plane, Train } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Announcements,
  type ScreenReaderInstructions,
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
import { formatDuration, isIntercityMode } from '@/lib/utils/format';
import { displayName } from '@/lib/utils/placeName';
import { parseQualityNotices } from '@/lib/utils/qualityNotices';
import StepCard from './StepCard';
import SortableStepCard from './SortableStepCard';
import TransitInfo, { MODE_LABEL } from './TransitInfo';
import QualityNotices from './QualityNotices';

const FREE_TIME_THRESHOLD_MIN = 90;

const DRAG_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable: '스페이스나 엔터로 집고, 위아래 화살표로 옮긴 뒤 다시 스페이스나 엔터로 놓아요. Esc를 누르면 취소돼요.',
};
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface TimelinePanelProps {
  itinerary: Itinerary;
  selectedDay: number;  // dayNumber (1-indexed)
  onDayChange: (dayNumber: number) => void;
  onStepClick: (stepId: number) => void;
  editMode?: boolean;
  /** 상위(ResultLayout)가 ConfirmModal로 처리한다. */
  onRequestDeleteStep?: (step: ItineraryStep) => void;
  /** 공유 공개 뷰·확정된 일정. 대안 선택·편집 힌트를 끄고 StepCard를 readOnly로 그린다. */
  readOnly?: boolean;
  /** 걸린 Day 탭에는 점을, 선택된 Day에는 그날 항목을 보인다.
   *  공유 공개 뷰는 보는 사람이 고칠 수 없는 정보라 넘기지 않는다. */
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

  // 6px 이동해야 드래그를 시작해 카드 클릭·스크롤과 구분한다.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!currentGroup) return null;

  // 기본 안내는 영어이고 내부 id를 읽는다.
  const placeName = (id: string | number) => {
    const place = currentGroup.steps.find((s) => s.id === Number(id))?.place;
    return place ? displayName(place) : '장소';
  };
  const positionOf = (id: string | number) => currentGroup.steps.findIndex((s) => s.id === Number(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${placeName(active.id)}을(를) 집었어요. 지금 ${positionOf(active.id)}번째예요.`,
    onDragOver: ({ active, over }) =>
      over ? `${placeName(active.id)}이(가) ${positionOf(over.id)}번째 자리 위에 있어요.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${placeName(active.id)}을(를) ${positionOf(over.id)}번째로 옮겼어요.` : `${placeName(active.id)}을(를) 놓았어요.`,
    onDragCancel: ({ active }) => `${placeName(active.id)} 옮기기를 취소했어요.`,
  };

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
    // 같은 day 내에서만 재정렬한다(Property 22).
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
              /* 활성에도 transparent border를 둬야 활성/비활성 높이가 1px 달라지지 않는다. */
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
            {/* 백엔드가 직선거리에 도로 계수를 곱해 거리·시간을 계산한다. 실제 경로 엔진이 없다. */}
            <span className="text-xs font-medium text-muted-2">직선거리 기준 추정</span>
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
            <GripVertical size={13} aria-hidden="true" /> 끌어서 순서 변경 · 휴지통으로 삭제 · 숙소·공항은 자리 고정
          </span>
        )}
      </div>

      <QualityNotices items={dayNotices} />

      {editMode && !readOnly ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{ announcements, screenReaderInstructions: DRAG_INSTRUCTIONS }}
        >
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
      <div>
        {currentGroup.steps.map((step, idx) => {
          const isLast = idx === currentGroup.steps.length - 1;
          const next = isLast ? null : currentGroup.steps[idx + 1];
          const gap = next ? freeGapMinutes(step, next) : 0;
          return (
            <div key={step.id} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
                  {idx + 1}
                </span>
                {/* card-border는 캔버스 위에서 거의 보이지 않아 레일이 끊겨 보이므로 번호 배지 계열을 쓴다. */}
                {!isLast && <span className="my-1.5 w-0.5 flex-1 rounded-full bg-accent/25" />}
              </div>

              <div className="min-w-0 flex-1 pb-2">
                {/* 도시를 옮기는 날은 그날 첫 구간이 열차·비행기·차 이동이다. */}
                {idx === 0 && step.transportationMode && isIntercityMode(step.transportationMode) && (
                  <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-2 tabular-nums">
                    {step.transportationMode === 'FLIGHT' && <Plane size={12} aria-hidden="true" />}
                    {step.transportationMode === 'DRIVE' && <Car size={12} aria-hidden="true" />}
                    {step.transportationMode === 'TRAIN' && <Train size={12} aria-hidden="true" />}
                    {MODE_LABEL[step.transportationMode]} 도시 이동
                    {step.transportationDuration != null && ` · ${formatDuration(step.transportationDuration)}`}
                    {step.transportationDistance != null && ` (${Math.round(step.transportationDistance)}km)`}
                  </div>
                )}
                {idx === 0 && step.transportationMode && !isIntercityMode(step.transportationMode) && (
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

                {next && (
                  <>
                    {/* surface-2는 card-bg와 거의 같아 채우면 자유시간이 스톱처럼 보이므로 점선 테두리만 둔다. */}
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
