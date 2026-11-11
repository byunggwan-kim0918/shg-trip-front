'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Share2, Pencil, Trash2 } from 'lucide-react';
import { normalizeText } from '@/lib/utils/text';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import type { ItineraryStep } from '@/lib/types/itinerary';
import { formatBudget, UNREALISTIC_LEG_KM } from '@/lib/utils/format';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { displayName } from '@/lib/utils/placeName';
import { nightsLabel } from '@/lib/utils/tripStatus';
import { finalizeItinerary, shareItinerary, updateItinerary } from '@/lib/data/itineraryService';
import Toast from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import EditItineraryModal from './EditItineraryModal';
import TimelinePanel from './TimelinePanel';
import MapPanel from './MapPanel';
import { ROUTES } from '@/lib/routes';

/** LLM 태그 뒤쪽은 서로 비슷하거나 일정에 없는 장소라 앞쪽만 보이고 나머지는 "+N"으로 접는다. */
const MAX_VISIBLE_TAGS = 6;

function daysUntilExpiry(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function toMinutes(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

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
  const router = useRouter();
  const { currentItinerary, selectedDay, selectedStepId, setSelectedDay, setSelectedStep, setCurrentItinerary,
    alternativeError, clearAlternativeError,
    deleteStepAction, isEditingSteps, stepError, clearStepError,
    patchItinerarySummary, removeItinerary, isDeleting } = useItineraryStore();
  const [showMap, setShowMap] = useState(true);
  const [coverError, setCoverError] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<ItineraryStep | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const shareNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = useCallback(async () => {
    if (!currentItinerary || sharing) return;
    setSharing(true);
    try {
      const { shareToken, expiresAt } = await shareItinerary(currentItinerary.id);
      const url = `${window.location.origin}/shared/${shareToken}`;
      try {
        await navigator.clipboard.writeText(url);
        setShareNotice(`공유 링크가 복사됐어요 · ${daysUntilExpiry(expiresAt)}일 후 만료`);
      } catch {
        // 클립보드 권한이 없으면 링크를 안내에 노출해 직접 복사하게 한다.
        setShareNotice(`공유 링크: ${url}`);
      }
      if (shareNoticeTimer.current) clearTimeout(shareNoticeTimer.current);
      shareNoticeTimer.current = setTimeout(() => setShareNotice(null), 4000);
    } catch (e) {
      setShareNotice(e instanceof Error ? e.message : '공유 링크 생성에 실패했어요.');
      if (shareNoticeTimer.current) clearTimeout(shareNoticeTimer.current);
      shareNoticeTimer.current = setTimeout(() => setShareNotice(null), 4000);
    }
    setSharing(false);
  }, [currentItinerary, sharing]);

  const [editOpen, setEditOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = useCallback(async (payload: { title: string; tags: string[] }) => {
    if (!currentItinerary) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const updated = await updateItinerary(currentItinerary.id, payload);
      setCurrentItinerary(updated);
      patchItinerarySummary(updated.id, { title: updated.title, tags: updated.tags });
      setEditOpen(false);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '수정에 실패했어요. 새로고침 후 다시 시도해주세요.');
    }
    setEditBusy(false);
  }, [currentItinerary, setCurrentItinerary, patchItinerarySummary]);

  // 헤더 버튼과 모바일 고정 바가 확인 모달을 거쳐 같은 콜백을 쓴다.
  const handleFinalize = useCallback(async () => {
    if (!currentItinerary) return;
    setFinalizing(true);
    setFinalizeError(null);
    try {
      const updated = await finalizeItinerary(currentItinerary.id);
      setCurrentItinerary(updated);
      patchItinerarySummary(updated.id, { status: updated.status });
      setEditMode(false);
    } catch (e) {
      // 실패를 삼키면 버튼이 아무 반응 없는 것처럼 보인다.
      setFinalizeError(e instanceof Error ? e.message : '일정 확정에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
    setFinalizing(false);
    setFinalizeConfirmOpen(false);
  }, [currentItinerary, setCurrentItinerary, patchItinerarySummary]);

  const handleDeleteItinerary = useCallback(async () => {
    if (!currentItinerary) return;
    setDeleteError(null);
    try {
      await removeItinerary(currentItinerary.id);
      setDeleteConfirmOpen(false);
      router.push(ROUTES.trips);
    } catch (e) {
      setDeleteConfirmOpen(false);
      setDeleteError(e instanceof Error ? e.message : '일정 삭제에 실패했어요.');
    }
  }, [currentItinerary, removeItinerary, router]);

  const handleConfirmDeleteStep = useCallback(async () => {
    if (!currentItinerary || !stepToDelete) return;
    await deleteStepAction(currentItinerary.id, stepToDelete.id);
    setStepToDelete(null);
  }, [currentItinerary, stepToDelete, deleteStepAction]);

  useEffect(() => () => {
    if (shareNoticeTimer.current) clearTimeout(shareNoticeTimer.current);
  }, []);

  // 표시 커버는 coverImage ?? 첫 스텝 이미지라, 대안 선택·삭제로 firstStepImage가 바뀔 때도 리셋해야
  // 그라데이션 폴백에 고착되지 않는다.
  useEffect(() => { setCoverError(false); }, [
    currentItinerary?.id,
    currentItinerary?.coverImage,
    currentItinerary?.steps.find((s) => s.place?.imageUrl)?.place?.imageUrl,
  ]);

  // 탭 여러 개를 띄워도 어느 여행인지 구분되게 한다. 컴포넌트 <title>은 레이아웃 metadata 제목과
  // head에 함께 올라가 어느 쪽이 적용될지 보장되지 않아 직접 바꾼다.
  const pageTitle = currentItinerary
    ? `${normalizeText(currentItinerary.title) || currentItinerary.destination} · SHG trip`
    : null;
  useEffect(() => {
    if (pageTitle) document.title = pageTitle;
  }, [pageTitle]);

  if (!currentItinerary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">일정을 찾을 수 없어요</p>
      </div>
    );
  }

  const { destination, startDate, endDate, totalBudget, coverImage, tags } = currentItinerary;
  const finalized = currentItinerary.status === 'FINALIZED';
  const hasSteps = currentItinerary.steps.length > 0;
  // 과거 데이터에는 없는 필드다.
  const qualityNotices = currentItinerary.qualityNotices ?? [];

  // 이동비를 빼면 렌터카/택시 여행 지출이 과소 표시된다.
  // 대안 선택이 바로 반영되게 steps에서 합산한다.
  const estimatedTotal = currentItinerary.steps.reduce(
    (sum, s) => sum + (s.estimatedCost ?? 0) + (s.transportationCost ?? 0), 0);
  const budgetPct = totalBudget && totalBudget > 0
    ? Math.round((estimatedTotal / totalBudget) * 100)
    : null;
  const overBudget = budgetPct != null && budgetPct > 100;

  const timeAnomaly = hasTimeAnomaly(currentItinerary.steps);
  const unrealisticLeg = currentItinerary.steps.some(
    (s) => s.transportationDistance != null && s.transportationDistance > UNREALISTIC_LEG_KM,
  );
  // 과거 데이터의 상대경로(/api/places/{id}/photo)는 깨지므로 절대 URL(S3)만 쓰고,
  // 없으면 비동기 업로드로 함께 채워지는 첫 스텝 imageUrl로 폴백한다.
  const validCover = coverImage && /^https?:\/\//.test(coverImage) ? coverImage : null;
  const firstStepImage = currentItinerary.steps.find((s) => s.place?.imageUrl)?.place?.imageUrl ?? null;
  const cover = proxyImageUrl(validCover ?? firstStepImage);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-8rem)]">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b border-card-border px-4 py-4 sm:px-6 sm:py-5 lg:flex-nowrap">
        <div className="hidden h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl lg:block">
          {cover && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={normalizeText(currentItinerary.title) || destination}
              className="h-full w-full object-cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            // 큰 그라데이션 블록은 정보 없이 헤더를 지배하므로 목적지 이니셜만 둔다.
            <div className="flex h-full w-full items-center justify-center bg-surface-3">
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-muted">{destination.slice(0, 2)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* items-center면 제목이 2줄일 때 연필 버튼이 두 줄 사이 중앙에 놓인다. */}
          <div className="flex items-start gap-2">
            {/* LLM 제목은 60자를 넘는 문장이라 30px + truncate면 무슨 여행인지 안 보여 23px 2줄로 둔다. */}
            <h1 className="min-w-0 line-clamp-2 text-[23px] font-extrabold leading-[1.25] tracking-[-0.03em] text-foreground">
              {normalizeText(currentItinerary.title) || destination}
            </h1>
            <button
              ref={editButtonRef}
              type="button"
              onClick={() => setEditOpen(true)}
              /* mt-px: 첫 줄 높이 28.75px 안에서 27px 버튼을 수직 중앙에 맞춘다. 터치 영역만 after로 44px까지 넓힌다. */
              className="relative after:absolute after:-inset-2 after:content-[''] mt-px shrink-0 rounded-[10px] p-1.5 text-muted-2 transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="제목·태그 편집"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-[13px] font-medium text-muted">
            {startDate} - {endDate} · {nightsLabel(startDate, endDate)}
            {totalBudget != null && (
              <span
                className={overBudget ? 'font-semibold text-danger' : undefined}
                title="입장료·식사비 데이터가 없는 항목은 카테고리 평균으로 추정합니다. 실제 지출과 다를 수 있습니다."
              >
                {' · 추정 '}
                <b className="text-foreground">{formatBudget(estimatedTotal)}원</b>
                {' / 예산 '}<span className="tabular-nums">{formatBudget(totalBudget)}원{budgetPct != null && ` (약 ${budgetPct}%)`}</span>
              </span>
            )}
            {totalBudget == null && estimatedTotal > 0 && (
              <span title="입장료·식사비 데이터가 없는 항목은 카테고리 평균으로 추정합니다.">
                {' · 추정 '}<b className="text-foreground">{formatBudget(estimatedTotal)}원</b>
              </span>
            )}
          </p>
          {/* 입장료·가격대 데이터가 대부분 비어 카테고리 기본값으로 계산하므로 퍼센트를 단정하지 않고 추정임을 밝힌다. */}
          {estimatedTotal > 0 && (
            <p className="mt-1 text-xs text-muted-2">
              금액은 추정치입니다. 입장료·실제 가격 정보가 없는 항목은 카테고리 평균으로 계산했습니다.
            </p>
          )}
          {/* 데이터는 그대로 두고 표시만 줄인다. 편집 모달에서는 전체를 다룬다. */}
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                <span key={tag} className="rounded-full px-2 py-0.5 text-xs font-semibold text-muted-2 ring-1 ring-card-border">
                  {tag}
                </span>
              ))}
              {tags.length > MAX_VISIBLE_TAGS && (
                <span className="text-xs font-semibold text-muted-2" title={tags.slice(MAX_VISIBLE_TAGS).join(' · ')}>
                  +{tags.length - MAX_VISIBLE_TAGS}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:flex-col lg:items-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="min-h-[36px] rounded-lg p-2 text-muted-2 transition-colors hover:bg-surface-hover hover:text-danger"
              aria-label="일정 삭제"
              title="일정 삭제"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
            {!finalized && hasSteps && (
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                aria-pressed={editMode}
                className={`min-h-[36px] rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  editMode
                    ? 'border-accent bg-accent text-accent-fg hover:brightness-105'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                {editMode ? '편집 완료' : '일정 편집'}
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="hidden min-h-[36px] items-center gap-1.5 rounded-lg border border-card-border bg-card-bg px-3.5 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-hover disabled:opacity-50 sm:inline-flex"
            >
              <Share2 size={14} aria-hidden="true" /> {sharing ? '생성 중...' : '공유'}
            </button>
            {currentItinerary.status === 'DRAFT' && (
              // 모바일은 하단 고정 확정 바가 맡으므로 헤더 버튼은 lg 이상에서만 보인다.
              <button
                type="button"
                disabled={finalizing || !hasSteps}
                title={hasSteps ? undefined : '장소가 없는 일정은 확정할 수 없어요'}
                onClick={() => setFinalizeConfirmOpen(true)}
                className="hidden min-h-[36px] rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-accent-fg shadow-[0_8px_18px_-8px_rgba(20,22,28,0.45)] transition-[filter] hover:brightness-105 disabled:opacity-50 lg:block disabled:shadow-none"
              >
                {finalizing ? '확정 중...' : '일정 확정'}
              </button>
            )}
            {currentItinerary.status === 'FINALIZED' && (
              <span className="rounded-[10px] bg-status-done-bg px-3.5 py-2 text-[13px] font-semibold text-status-done">확정됨</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="min-h-[32px] rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-xs font-semibold text-text-2 transition-colors hover:bg-surface-hover lg:hidden"
          >
            {showMap ? '지도 숨기기' : '지도 보기'}
          </button>
        </div>
      </div>

      {editMode && (
        <div className="border-b border-accent-soft bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-weak-fg sm:px-6">
          편집 모드 · 같은 날 안에서 끌어서 순서를 바꾸거나 휴지통으로 삭제하세요. 시간과 숙소·공항 자리는 그대로예요.
        </div>
      )}

      {shareNotice && (
        <div role="status" className="border-b border-accent-soft bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-weak-fg sm:px-6">
          {shareNotice}
        </div>
      )}

      {(timeAnomaly || unrealisticLeg) && (
        <div className="px-4 py-2 bg-warn-bg border-b border-warn-border flex items-start gap-2 text-xs text-warn-fg">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            일부 장소의 위치·시간 정보가 정확하지 않을 수 있어요.
            {timeAnomaly && ' 일정 시간 순서를 확인해 주세요.'}
            {unrealisticLeg && ' 이동 거리가 비정상적으로 큰 구간이 있어요.'}
            {' '}대안 선택으로 다른 장소로 바꿀 수 있어요.
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        <div
          className={`w-full shrink-0 overflow-hidden border-b border-card-border lg:order-2 lg:h-auto lg:w-[52%] lg:shrink lg:border-b-0 lg:border-l ${
            showMap ? 'block h-[180px]' : 'hidden lg:block'
          }`}
        >
          <MapPanel
            steps={currentItinerary.steps}
            selectedDay={selectedDay}
            selectedStepId={selectedStepId}
            onMarkerClick={setSelectedStep}
          />
        </div>

        {/* 폭은 flex-1이 정하므로 비율은 지도의 lg:w-[52%]로만 바뀐다. 여기 w-[48%]는 실효가 없다. */}
        <div className="w-full flex-1 lg:order-1 lg:w-[48%] lg:overflow-y-auto">
          <TimelinePanel
            itinerary={currentItinerary}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onStepClick={setSelectedStep}
            editMode={editMode && !finalized}
            onRequestDeleteStep={setStepToDelete}
            qualityNotices={qualityNotices}
            readOnly={finalized}
          />
        </div>
      </div>

      {currentItinerary.status === 'DRAFT' && (
        <div className="sticky bottom-0 z-10 shrink-0 border-t border-card-border bg-card-bg px-4 py-3 lg:hidden">
          <button
            type="button"
            disabled={finalizing || !hasSteps}
            onClick={() => setFinalizeConfirmOpen(true)}
            className="w-full rounded-[10px] bg-accent py-3.5 text-[15px] font-bold text-accent-fg shadow-[0_8px_20px_-8px_rgba(20,22,28,0.45)] transition-[filter] hover:brightness-105 disabled:opacity-50 disabled:shadow-none"
          >
            {finalizing ? '확정 중...' : '일정 확정'}
          </button>
        </div>
      )}

      {alternativeError && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Toast
              title="대안을 변경하지 못했어요"
              description={alternativeError}
              onClose={clearAlternativeError}
            />
          </div>
        </div>
      )}

      {/* 낙관 반영은 이미 롤백된 상태다 */}
      {stepError && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Toast
              title="편집을 반영하지 못했어요"
              description={stepError}
              onClose={clearStepError}
            />
          </div>
        </div>
      )}

      {finalizeError && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Toast
              title="일정을 확정하지 못했어요"
              description={finalizeError}
              onClose={() => setFinalizeError(null)}
            />
          </div>
        </div>
      )}

      {deleteError && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="w-full max-w-md">
            <Toast
              title="일정을 삭제하지 못했어요"
              description={deleteError}
              onClose={() => setDeleteError(null)}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        open={finalizeConfirmOpen}
        title="이 일정을 확정할까요?"
        message="확정은 되돌릴 수 없어요. 확정하면 스톱 순서 변경·삭제와 대안 선택을 더 이상 할 수 없고, 제목과 태그만 고칠 수 있어요."
        confirmLabel="확정"
        busy={finalizing}
        onConfirm={handleFinalize}
        onCancel={() => { if (!finalizing) setFinalizeConfirmOpen(false); }}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="이 일정을 삭제할까요?"
        message="삭제한 일정은 되돌릴 수 없고, 공유 링크도 더 이상 열리지 않아요."
        confirmLabel="삭제"
        danger
        busy={isDeleting}
        onConfirm={handleDeleteItinerary}
        onCancel={() => { if (!isDeleting) setDeleteConfirmOpen(false); }}
      />

      <ConfirmModal
        open={stepToDelete != null}
        title="이 스톱을 삭제할까요?"
        message={stepToDelete?.place
          ? `'${displayName(stepToDelete.place)}'을(를) 일정에서 제거합니다. 남은 스톱의 이동 경로가 다시 계산돼요.`
          : '이 스톱을 일정에서 제거합니다.'}
        confirmLabel="삭제"
        danger
        busy={isEditingSteps}
        onConfirm={handleConfirmDeleteStep}
        onCancel={() => { if (!isEditingSteps) setStepToDelete(null); }}
      />

      {/* 폴링으로 currentItinerary가 교체돼도 편집값이 리셋되지 않게 key로 열 때만 재마운트한다 */}
      <EditItineraryModal
        key={editOpen ? 'edit-open' : 'edit-closed'}
        open={editOpen}
        returnFocusRef={editButtonRef}
        initialTitle={normalizeText(currentItinerary.title) || destination}
        initialTags={tags ?? []}
        busy={editBusy}
        error={editError}
        onSave={handleSaveEdit}
        onCancel={() => { if (!editBusy) { setEditOpen(false); setEditError(null); } }}
      />
    </div>
  );
}
