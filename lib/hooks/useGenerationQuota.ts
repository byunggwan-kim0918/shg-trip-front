'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchGenerationQuota, type GenerationQuota } from '@/lib/data/itineraryService';

/**
 * 생성 쿼터/차단 상태 조회 훅 (R1/R2).
 * NewTripShell·ConfirmStep 마운트 시 1회 fetch → 배지 표시 + 생성 버튼 disable 판정에 사용.
 * 조회 실패 시 fail-open(막지 않음) — 실제 차단은 백엔드가 강제한다.
 */
export function useGenerationQuota() {
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setQuota(await fetchGenerationQuota());
    } catch {
      setQuota(null); // 조회 실패 → 배지 숨김, 생성은 허용(백엔드가 최종 판정)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const blocked = !!quota?.blockedUntil;
  const exhausted = !!quota && quota.used >= quota.limit;
  // quota가 null(조회 실패)이면 canGenerate=true (fail-open)
  const canGenerate = !blocked && !exhausted;

  return { quota, loading, canGenerate, blocked, exhausted, refetch };
}
