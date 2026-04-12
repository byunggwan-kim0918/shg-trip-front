'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import type { ItineraryStatus } from '@/lib/types/itinerary';

const STATUS_LABELS: Record<ItineraryStatus, string> = {
  DRAFT: '초안',
  FINALIZED: '확정',
  ARCHIVED: '보관',
};

const STATUS_STYLES: Record<ItineraryStatus, string> = {
  DRAFT: 'bg-accent-soft text-accent',
  FINALIZED: 'bg-success/10 text-success',
  ARCHIVED: 'bg-surface text-muted',
};

function getDuration(start: string, end: string) {
  const n = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return `${n}박 ${n + 1}일`;
}

export default function ItineraryList() {
  const router = useRouter();
  const { itineraries, loadItineraries } = useItineraryStore();

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-muted mb-4">아직 생성된 일정이 없습니다</p>
        <button
          type="button"
          onClick={() => router.push('/main')}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
        >
          새 일정 만들기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground">내 일정함</h1>
      <div className="space-y-3">
        {itineraries.map((itin) => {
          const status = itin.status as ItineraryStatus;
          return (
            <button
              key={itin.id}
              type="button"
              onClick={() => router.push(`/main/itinerary/${itin.id}`)}
              className="w-full text-left p-4 rounded-xl border border-card-border bg-card-bg hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {itin.title ?? itin.destination}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? 'bg-surface text-muted'}`}>
                  {STATUS_LABELS[status] ?? status}
                </span>
              </div>
              <p className="text-xs text-muted">
                {itin.startDate} ~ {itin.endDate} ({getDuration(itin.startDate, itin.endDate)})
              </p>
              <p className="text-xs text-muted mt-0.5">
                생성일: {new Date(itin.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
