'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import Portal from '@/components/common/Portal';
import { useModalA11y } from '@/lib/hooks/useModalA11y';
import { previewAlternative, StepEditError } from '@/lib/data/itineraryService';
import type { AlternativeOption, AlternativePreview, ItineraryStep, PreviewLeg } from '@/lib/types/itinerary';
import { formatDuration } from '@/lib/utils/format';
import { formatOpeningHours } from '@/lib/utils/openingHours';
import { placeDescription } from '@/lib/utils/placeDescription';
import { displayName } from '@/lib/utils/placeName';
import { MODE_LABEL } from './TransitInfo';

interface Props {
  itineraryId: number;
  step: ItineraryStep;
  alternative: AlternativeOption;
  /** 같은 날 앞뒤 스텝. 미리보기 구간의 장소 이름에만 쓴다. */
  prevStep: ItineraryStep | null;
  nextStep: ItineraryStep | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** 화면이 낡아 미리보기를 못 받았을 때. 최신 일정을 다시 불러오고 창을 닫는다. */
  onStale: (e: unknown) => void;
  /** 바꾸면 대안 목록이 접혀 연 카드가 사라지므로 대신 돌아갈 곳. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

type LegChange = NonNullable<AlternativePreview['incoming']>;

function legText(leg: PreviewLeg): string | null {
  if (leg.durationMin == null && leg.distanceKm == null) return null;
  const label = (leg.mode && MODE_LABEL[leg.mode]) ?? '이동';
  const parts = [leg.durationMin != null ? `${label} ${formatDuration(leg.durationMin)}` : label];
  if (leg.distanceKm != null) parts.push(`${leg.distanceKm.toFixed(1)}km`);
  return parts.join(' · ');
}

function sameLeg(a: PreviewLeg, b: PreviewLeg): boolean {
  return a.mode === b.mode && a.durationMin === b.durationMin && a.distanceKm === b.distanceKm;
}

/**
 * 앞뒤 구간의 이동 시간·거리 변화 합. 바꾸기 전이나 뒤를 모르는 구간은 뺀다.
 * 서버는 다시 재지 못한 구간을 바꾸기 전 값으로 주므로 모든 구간이 그대로면 변화를 말하지 않는다.
 */
function travelDelta(changes: LegChange[]): { minutes: number; km: number | null } | null {
  if (changes.every((c) => sameLeg(c.before, c.after))) return null;
  const timed = changes.filter((c) => c.before.durationMin != null && c.after.durationMin != null);
  if (timed.length === 0) return null;
  const measured = changes.filter((c) => c.before.distanceKm != null && c.after.distanceKm != null);
  return {
    minutes: timed.reduce((sum, c) => sum + c.after.durationMin! - c.before.durationMin!, 0),
    km: measured.length === 0 ? null
      : measured.reduce((sum, c) => sum + c.after.distanceKm! - c.before.distanceKm!, 0),
  };
}

// 가까운 대안은 걷기로 바뀌어 거리는 줄고 시간은 늘 수 있어 둘의 방향을 따로 말한다.
function deltaText({ minutes, km }: { minutes: number; km: number | null }): string {
  const time = minutes === 0 ? '이동 시간은 그대로예요'
    : `이동 시간이 ${formatDuration(Math.abs(minutes))} ${minutes > 0 ? '늘어요' : '줄어요'}`;
  if (km == null || Math.abs(km) < 0.1) return time;
  return `${time} · 거리는 ${Math.abs(km).toFixed(1)}km ${km > 0 ? '늘어요' : '줄어요'}`;
}

function LegRow({ label, change }: { label: string; change: LegChange }) {
  const before = legText(change.before);
  const after = legText(change.after);
  return (
    <li className="text-xs">
      <p className="text-muted-2">{label}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-semibold tabular-nums text-text-2">
        {sameLeg(change.before, change.after) ? (
          <span>{after ?? '이동 정보 없음'}</span>
        ) : (
          <>
            <span className="text-muted line-through decoration-muted-2">{before ?? '이동 정보 없음'}</span>
            <ArrowRight size={11} className="shrink-0 text-muted-2" aria-hidden="true" />
            <span className="sr-only">, 바꾸면</span>
            <span>{after ?? '이동 정보 없음'}</span>
          </>
        )}
      </p>
    </li>
  );
}

export default function AlternativePreviewDialog({
  itineraryId,
  step,
  alternative,
  prevStep,
  nextStep,
  busy,
  onConfirm,
  onCancel,
  onStale,
  returnFocusRef,
}: Props) {
  const [preview, setPreview] = useState<AlternativePreview | null>(null);
  const [failed, setFailed] = useState(false);
  const description = placeDescription(alternative.place);
  const [introOpen, setIntroOpen] = useState(false);
  const [introClamped, setIntroClamped] = useState(false);
  const introRef = useRef<HTMLParagraphElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // 상세 화면은 이야기 폴링으로 자주 다시 그려져 부모 콜백이 바뀔 때마다 미리보기를 다시 부르지 않게 한다.
  const onStaleRef = useRef(onStale);
  useEffect(() => { onStaleRef.current = onStale; });
  useModalA11y(true, dialogRef, returnFocusRef);

  useEffect(() => {
    let ignore = false;
    previewAlternative(itineraryId, step.id, alternative.id)
      .then((p) => { if (!ignore) setPreview(p); })
      .catch((e: unknown) => {
        if (ignore) return;
        if (e instanceof StepEditError && e.stale) onStaleRef.current(e);
        else setFailed(true);
      });
    return () => { ignore = true; };
  }, [itineraryId, step.id, alternative.id]);

  useEffect(() => { confirmRef.current?.focus(); }, []);

  // 몇 줄로 접히는지는 창 폭과 글꼴에 달려 있어 실제로 넘치는지 잰다.
  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setIntroClamped(el.scrollHeight > el.clientHeight + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [description]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const from = step.place ? displayName(step.place) : '지금 장소';
  const to = displayName(alternative.place);
  const timeRange = [step.startTime, step.endTime].filter(Boolean).join(' - ');
  const legs: Array<{ label: string; change: LegChange }> = [];
  if (preview?.incoming) {
    legs.push({ label: `${prevStep?.place ? displayName(prevStep.place) : '앞 장소'}에서 오는 길`, change: preview.incoming });
  }
  if (preview?.outgoing) {
    legs.push({ label: `${nextStep?.place ? displayName(nextStep.place) : '다음 장소'}까지 가는 길`, change: preview.outgoing });
  }
  const delta = travelDelta(legs.map((l) => l.change));
  // 0원은 비용 정보가 없다는 뜻이라 StepCard처럼 금액으로 보이지 않는다.
  const costBefore = (preview?.costBefore ?? 0) > 0 ? preview!.costBefore! : null;
  const costAfter = (preview?.costAfter ?? 0) > 0 ? preview!.costAfter! : null;

  const warnings: string[] = [];
  const outsideHours = !preview?.closedThatDay && preview?.openAtTime === false;
  if (preview?.closedThatDay) warnings.push('이날은 쉬는 날이에요.');
  else if (outsideHours) warnings.push(`머무는 시간(${timeRange})이 영업시간을 벗어나요.`);
  if (preview?.alreadyOnDay != null) warnings.push(`${preview.alreadyOnDay}일차 일정에 이미 있는 곳이에요.`);

  return (
    <Portal>
      {/* 포털 안 클릭도 React 트리를 따라 조상 핸들러로 올라간다. */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { e.stopPropagation(); if (!busy) onCancel(); }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alt-preview-title"
          aria-describedby="alt-preview-body"
          className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[10px] border border-card-border bg-card-bg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto p-5">
            <h2 id="alt-preview-title" className="text-[17px] font-semibold text-foreground">이 장소로 바꿀까요?</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
              <span className="sr-only">지금</span>
              <span>{from}</span>
              <ArrowRight size={13} className="shrink-0" aria-hidden="true" />
              <span className="sr-only">, 바꿀 곳</span>
              <b className="font-bold text-foreground">{to}</b>
            </p>
            {alternative.notes && <p className="mt-1 text-xs text-muted-2">{alternative.notes}</p>}
            {description && (
              <div className="mt-2">
                {/* 긴 소개가 휴대폰에서 영업·휴무 경고를 스크롤 아래로 밀지 않게 접어 둔다. */}
                <p ref={introRef} className={`text-[13px] leading-[1.55] text-text-2 ${introOpen ? '' : 'line-clamp-3'}`}>
                  {description}
                </p>
                {(introClamped || introOpen) && (
                  <button
                    type="button"
                    onClick={() => setIntroOpen((v) => !v)}
                    aria-expanded={introOpen}
                    className="mt-0.5 text-xs font-bold text-accent-weak-fg hover:underline"
                  >
                    {introOpen ? '소개 접기' : '소개 더 보기'}
                  </button>
                )}
              </div>
            )}

            {/* 첫 포커스가 바꾸기 버튼이라 늦게 오는 경고는 알림 영역으로 읽힌다. */}
            <div id="alt-preview-body" aria-live="polite">
            {!preview && !failed && (
              <p className="mt-4 text-xs text-muted-2 animate-pulse">바꾼 뒤 달라지는 점을 확인하고 있어요…</p>
            )}
            {failed && (
              <p className="mt-4 text-xs text-muted-2">달라지는 점을 불러오지 못했어요. 그래도 바꿀 수는 있어요.</p>
            )}

            {preview && (
              <div className="mt-4 space-y-4">
                {legs.length > 0 && (
                  <section>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xs font-bold tracking-[0.03em] text-muted-2">이동</h3>
                      {/* 백엔드가 직선거리에 도로 계수를 곱해 다시 잰다. 실제 경로 엔진이 없다. */}
                      {delta && <span className="text-[11px] text-muted-2">직선거리 기준 추정</span>}
                    </div>
                    <ul className="mt-1.5 space-y-2">
                      {legs.map((l) => <LegRow key={l.label} label={l.label} change={l.change} />)}
                    </ul>
                    {delta && <p className="mt-2 text-xs font-semibold text-text-2">{deltaText(delta)}</p>}
                  </section>
                )}

                {costAfter != null && costBefore != null && costAfter !== costBefore && (
                  <p className="text-xs text-muted-2 tabular-nums">
                    장소 예상 비용 {costBefore.toLocaleString()}원
                    <ArrowRight size={11} className="mx-1 inline align-[-1px]" aria-hidden="true" />
                    <span className="sr-only">, 바꾸면 </span>
                    <b className="font-bold text-text-2">{costAfter.toLocaleString()}원</b>
                  </p>
                )}
                {costAfter != null && costBefore == null && (
                  <p className="text-xs text-muted-2 tabular-nums">
                    장소 예상 비용 <b className="font-bold text-text-2">{costAfter.toLocaleString()}원</b>
                  </p>
                )}

                {warnings.length > 0 && (
                  <ul className="space-y-1 rounded-[10px] border border-warn-border bg-warn-bg px-3 py-2.5 text-xs">
                    {warnings.map((w) => (
                      <li key={w} className="flex items-start gap-1.5 font-semibold text-text-2">
                        <AlertTriangle size={12} className="mt-[2px] shrink-0 text-warn-fg" aria-hidden="true" />
                        <span className="min-w-0">{w}</span>
                      </li>
                    ))}
                    {outsideHours && alternative.place.openingHours && (
                      <li className="pl-[18px] text-muted">영업시간 · {formatOpeningHours(alternative.place.openingHours)}</li>
                    )}
                  </ul>
                )}

                {preview.resolvedNotices.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold tracking-[0.03em] text-muted-2">바꾸면 해결돼요</h3>
                    <ul className="mt-1.5 space-y-1 text-xs">
                      {preview.resolvedNotices.map((n) => (
                        <li key={n} className="flex items-start gap-1.5 text-text-2">
                          <CheckCircle2 size={12} className="mt-[2px] shrink-0 text-success" aria-hidden="true" />
                          <span className="min-w-0">{n}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {preview.newNotices.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold tracking-[0.03em] text-muted-2">바꾸면 새로 생기는 안내</h3>
                    <ul className="mt-1.5 space-y-1 text-xs">
                      {preview.newNotices.map((n) => (
                        <li key={n} className="flex items-start gap-1.5 text-text-2">
                          <Info size={12} className="mt-[2px] shrink-0 text-warn-fg" aria-hidden="true" />
                          <span className="min-w-0">{n}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-card-border px-5 py-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-[44px] rounded-[10px] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
            >
              취소
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="min-h-[44px] rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? '바꾸는 중…' : '바꾸기'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
