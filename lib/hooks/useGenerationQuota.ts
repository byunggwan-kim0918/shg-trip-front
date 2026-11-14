'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchGenerationQuota, isUnbilledBlocked, type GenerationQuota } from '@/lib/data/itineraryService';

/** 조회 실패 시 fail-open한다. 실제 차단은 백엔드가 강제한다. */
export function useGenerationQuota() {
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setQuota(await fetchGenerationQuota());
    } catch {
      setQuota(null);  // 배지는 숨기고 생성은 허용한다(백엔드가 최종 판정)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const blocked = !!quota?.blockedUntil || isUnbilledBlocked(quota);
  const exhausted = !!quota && quota.used >= quota.limit;
  // quota가 null이면 true다(fail-open).
  const canGenerate = !blocked && !exhausted;

  return { quota, loading, canGenerate, blocked, exhausted, refetch };
}
