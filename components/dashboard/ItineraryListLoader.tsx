'use client';

import { useEffect } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import ErrorState from '@/components/common/ErrorState';
import ItineraryList from '@/components/dashboard/ItineraryList';

/** 목록과 같은 자리·크기의 골격. 스피너만 두면 불러온 뒤 화면 전체가 한 번에 바뀐다. */
function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-1 py-2" aria-busy="true" aria-label="내 여행을 불러오는 중">
      <div className="mb-4 flex items-end justify-between">
        <div className="h-8 w-32 rounded-lg shg-shimmer" />
        <div className="h-10 w-[92px] rounded-[10px] shg-shimmer" />
      </div>
      <div className="mb-5 flex gap-1.5">
        {[56, 52, 64, 52].map((w, i) => (
          <div key={i} className="h-[31px] rounded-full shg-shimmer" style={{ width: w }} />
        ))}
      </div>
      <div className="mb-4 h-[200px] rounded-xl shg-shimmer" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-card-border bg-card-bg">
            <div className="h-[88px] shg-shimmer" />
            <div className="flex flex-col gap-3 p-5">
              <div className="h-3.5 w-1/3 rounded shg-shimmer" />
              <div className="h-5 w-4/5 rounded shg-shimmer" />
              <div className="h-3 w-1/2 rounded shg-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 내 여행 목록을 불러온 상태에 따라 골격·오류·목록을 고른다. 아직 못 불러온 빈 배열을 "일정 없음"으로 그리지 않는다. */
export default function ItineraryListLoader({ empty }: { empty: React.ReactNode }) {
  const { itineraries, listStatus, isLoading, loadItineraries } = useItineraryStore();

  useEffect(() => {
    void loadItineraries();
  }, [loadItineraries]);

  if (listStatus === 'error') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <ErrorState
          className="w-full max-w-sm"
          title="내 여행을 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요."
          onRetry={() => void loadItineraries()}
        />
      </div>
    );
  }

  // 빈 목록을 새로 고치는 중이면 방금 만든 일정이 들어올 수 있다. 확인 전에 빈 화면을 열면 쓰지 않을 대화가 생긴다.
  if (listStatus !== 'success' || (itineraries.length === 0 && isLoading)) {
    return <DashboardSkeleton />;
  }

  if (itineraries.length === 0) return <>{empty}</>;
  return <ItineraryList itineraries={itineraries} />;
}
