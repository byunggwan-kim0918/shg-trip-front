'use client';

import { Info, AlertTriangle } from 'lucide-react';
import type { GenerationQuota } from '@/lib/data/itineraryService';

/** ISO → "M월 D일" (한국어). */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * "이번 달 생성 가능 N/5회 · 30일 기준" 배지 (R2).
 * 소진/차단 시 warn 톤 + 리셋 시각 안내. quota null(조회 실패)이면 렌더 안 함.
 */
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
  const exhausted = quota.used >= quota.limit;
  const warn = blocked || exhausted;

  let text: string;
  if (blocked) {
    text = `입력 검증 반복 실패로 생성이 잠시 제한됐어요 · ${formatDate(quota.blockedUntil)} 이후 가능`;
  } else if (exhausted) {
    text = `이번 달 생성 한도(${quota.limit}회)를 모두 사용했어요 · ${formatDate(quota.resetAt)} 이후 가능`;
  } else {
    text = `이번 달 생성 가능 ${remaining}/${quota.limit}회 · 30일 기준`;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
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
