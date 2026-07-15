'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, Share2, Pencil } from 'lucide-react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import type { ItineraryStep } from '@/lib/types/itinerary';
import { formatBudget, UNREALISTIC_LEG_KM } from '@/lib/utils/format';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { coverGradient } from '@/lib/utils/coverGradient';
import { nightsLabel } from '@/lib/utils/tripStatus';
import { finalizeItinerary, shareItinerary, updateItinerary } from '@/lib/data/itineraryService';
import Toast from '@/components/common/Toast';
import EditItineraryModal from './EditItineraryModal';
import TimelinePanel from './TimelinePanel';
import MapPanel from './MapPanel';

/** 만료일까지 남은 일수 (공유 안내용). */
function daysUntilExpiry(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
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
  const { currentItinerary, selectedDay, selectedStepId, setSelectedDay, setSelectedStep, setCurrentItinerary,
    alternativeError, clearAlternativeError } = useItineraryStore();
  const [showMap, setShowMap] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  // 편집 어피던스는 시각만 — 실제 드래그/삭제는 후속(백엔드 reorder/delete 필요)
  const [editNotice, setEditNotice] = useState(false);
  const editNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 공유
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
        // 클립보드 권한 없을 때: 링크를 안내에 노출(사용자가 직접 복사)
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

  // 제목/태그 편집
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = useCallback(async (payload: { title: string; tags: string[] }) => {
    if (!currentItinerary) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const updated = await updateItinerary(currentItinerary.id, payload);
      setCurrentItinerary(updated);
      setEditOpen(false);
    } catch (e) {
      // 409(Optimistic Lock 충돌) 등 — 모달에 에러 표시
      setEditError(e instanceof Error ? e.message : '수정에 실패했어요. 새로고침 후 다시 시도해주세요.');
    }
    setEditBusy(false);
  }, [currentItinerary, setCurrentItinerary]);

  // 확정: 헤더 버튼 + 모바일 고정 바가 공유하는 단일 콜백
  const handleFinalize = useCallback(async () => {
    if (!currentItinerary) return;
    setFinalizing(true);
    try {
      const updated = await finalizeItinerary(currentItinerary.id);
      setCurrentItinerary(updated);
    } catch { /* 이미 확정된 경우 등 무시 */ }
    setFinalizing(false);
  }, [currentItinerary, setCurrentItinerary]);

  const showEditNotice = useCallback(() => {
    setEditNotice(true);
    if (editNoticeTimer.current) clearTimeout(editNoticeTimer.current);
    editNoticeTimer.current = setTimeout(() => setEditNotice(false), 2400);
  }, []);

  useEffect(() => () => {
    if (editNoticeTimer.current) clearTimeout(editNoticeTimer.current);
    if (shareNoticeTimer.current) clearTimeout(shareNoticeTimer.current);
  }, []);

  if (!currentItinerary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">일정을 찾을 수 없습니다</p>
      </div>
    );
  }

  const { destination, startDate, endDate, totalBudget, coverImage, tags } = currentItinerary;

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
      {/* SummaryHeader (4a) */}
      <div className="flex items-start gap-4 border-b border-card-border px-4 py-4 sm:px-6 sm:py-5">
        {/* 커버 사각 74 */}
        <div className="hidden h-[74px] w-[74px] shrink-0 overflow-hidden rounded-2xl sm:block">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={currentItinerary.title ?? destination} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: coverGradient(destination) }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-extrabold tracking-[-0.02em] text-foreground sm:text-[23px]">
              {currentItinerary.title ?? destination}
            </h1>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="shrink-0 rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="제목·태그 편집"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5 text-[13.5px] font-medium text-muted">
            {startDate} – {endDate} · {nightsLabel(startDate, endDate)}
            {totalBudget != null && (
              <span className={overBudget ? 'font-semibold text-danger' : undefined}>
                {' · 예상 '}
                <b className="text-foreground">{formatBudget(estimatedTotal)}원</b>
                {' / 예산 '}{formatBudget(totalBudget)}원{budgetPct != null && ` (${budgetPct}%)`}
              </span>
            )}
            {totalBudget == null && estimatedTotal > 0 && (
              <span> · 예상 <b className="text-foreground">{formatBudget(estimatedTotal)}원</b></span>
            )}
          </p>
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-3 px-2.5 py-1 text-[12px] font-semibold text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={showEditNotice}
              className="min-h-[36px] rounded-xl border border-card-border bg-card-bg px-3.5 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-hover"
            >
              일정 편집
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="hidden min-h-[36px] items-center gap-1.5 rounded-xl border border-card-border bg-card-bg px-3.5 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-hover disabled:opacity-50 sm:inline-flex"
            >
              <Share2 size={14} aria-hidden="true" /> {sharing ? '생성 중...' : '공유'}
            </button>
            {currentItinerary.status === 'DRAFT' && (
              // 모바일은 하단 고정 확정 바가 담당 → 헤더 버튼은 lg 이상에서만
              <button
                type="button"
                disabled={finalizing}
                onClick={handleFinalize}
                className="hidden min-h-[36px] rounded-xl bg-accent px-4 py-2 text-[13px] font-bold text-white shadow-[0_8px_18px_-8px_var(--accent)] transition-[filter] hover:brightness-105 disabled:opacity-50 lg:block"
              >
                {finalizing ? '확정 중...' : '일정 확정'}
              </button>
            )}
            {currentItinerary.status === 'FINALIZED' && (
              <span className="rounded-xl bg-status-done-bg px-3.5 py-2 text-[13px] font-semibold text-status-done">확정됨</span>
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

      {editNotice && (
        <div className="border-b border-accent-soft bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-weak-fg sm:px-6">
          일정 편집(순서 변경·삭제)은 곧 제공될 예정이에요.
        </div>
      )}

      {shareNotice && (
        <div className="border-b border-accent-soft bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-weak-fg sm:px-6">
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

      {/* 본문. 모바일: 지도 상단 고정 → 타임라인 스크롤. lg: 타임라인 좌 / 지도 우. */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 지도 — 모바일 상단(고정 높이, 토글), lg 우측 */}
        <div
          className={`w-full shrink-0 overflow-hidden border-b border-card-border lg:order-2 lg:h-auto lg:w-[45%] lg:shrink lg:border-b-0 lg:border-l ${
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

        {/* 타임라인 */}
        <div className="w-full flex-1 overflow-y-auto lg:order-1 lg:w-[55%]">
          <TimelinePanel
            itinerary={currentItinerary}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onStepClick={setSelectedStep}
            editHint
          />
        </div>
      </div>

      {/* 모바일 하단 고정 확정 바 (DRAFT일 때) */}
      {currentItinerary.status === 'DRAFT' && (
        <div className="shrink-0 border-t border-card-border bg-card-bg px-4 py-3 lg:hidden">
          <button
            type="button"
            disabled={finalizing}
            onClick={handleFinalize}
            className="w-full rounded-[13px] bg-accent py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-[filter] hover:brightness-105 disabled:opacity-50"
          >
            {finalizing ? '확정 중...' : '일정 확정'}
          </button>
        </div>
      )}

      {/* 대안 선택 실패(네트워크 등) 토스트 */}
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

      {/* key로 열 때마다 재마운트 — 폴링(currentItinerary 교체) 중에도 편집값이 리셋되지 않게 */}
      <EditItineraryModal
        key={editOpen ? 'edit-open' : 'edit-closed'}
        open={editOpen}
        initialTitle={currentItinerary.title ?? destination}
        initialTags={tags ?? []}
        busy={editBusy}
        error={editError}
        onSave={handleSaveEdit}
        onCancel={() => { if (!editBusy) { setEditOpen(false); setEditError(null); } }}
      />
    </div>
  );
}
