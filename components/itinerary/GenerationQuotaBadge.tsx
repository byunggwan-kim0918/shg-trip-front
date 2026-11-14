'use client';

import { Info, AlertTriangle } from 'lucide-react';
import { isUnbilledBlocked, type GenerationQuota } from '@/lib/data/itineraryService';

/** ISO → "M월 D일" (한국어). */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** ISO → "M월 D일 HH:mm". 24시간 창은 날짜만으로는 언제 풀리는지 알 수 없다. */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** quota가 null(조회 실패)이면 렌더하지 않는다. */
export default function GenerationQuotaBadge({
  quota,
  className = '',
}: {
  quota: GenerationQuota | null;
  className?: string;
}) {
  if (!quota) return null;

  const remaining = Math.max(0, quota.limit - quota.used);
  const blocked = !!quota.blockedUntil;
  const unbilledBlocked = isUnbilledBlocked(quota);
  const exhausted = quota.used >= quota.limit;
  const warn = blocked || unbilledBlocked || exhausted;
  const unbilledUsed = quota.unbilledUsed ?? 0;

  let text: string;
  if (blocked) {
    text = `입력 검증 반복 실패로 생성이 잠시 제한됐어요 · ${formatDate(quota.blockedUntil)} 이후 가능`;
  } else if (exhausted) {
    text = `이번 달 생성 한도(${quota.limit}회)를 모두 사용했어요 · ${formatDate(quota.resetAt)} 이후 가능`;
  } else if (unbilledBlocked) {
    const until = formatDateTime(quota.unbilledResetAt);
    text = `기준에 못 미친 생성이 24시간 안에 ${quota.unbilledLimit}번 나와 잠시 멈췄어요${until ? ` · ${until} 이후 가능` : ''}`;
  } else {
    text = `이번 달 생성 가능 ${remaining}/${quota.limit}회 · 30일 기준`;
    // 기준에 못 미친 생성은 횟수를 쓰지 않지만 24시간 한도가 있어 하나라도 쌓이면 한도와 함께 알린다.
    if (unbilledUsed > 0 && quota.unbilledLimit) {
      text += ` · 기준 미달 ${unbilledUsed}회(${quota.unbilledLimit}회면 24시간 멈춤)`;
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        warn ? 'bg-warn-bg text-warn-fg' : 'bg-surface-3 text-muted'
      } ${className}`}
    >
      {warn ? (
        <AlertTriangle size={12} aria-hidden="true" />
      ) : (
        <Info size={12} aria-hidden="true" />
      )}
      {text}
    </div>
  );
}
