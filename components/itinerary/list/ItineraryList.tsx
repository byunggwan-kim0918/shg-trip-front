'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import ConfirmModal from '@/components/common/ConfirmModal';
import type { ItineraryStatus, ItinerarySummary } from '@/lib/types/itinerary';

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
  const { itineraries, loadItineraries, removeItinerary, isDeleting } = useItineraryStore();
  const [deleteTarget, setDeleteTarget] = useState<ItinerarySummary | null>(null);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeItinerary(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      alert('일정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

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
            <div
              key={itin.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/main/itinerary/${itin.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && router.push(`/main/itinerary/${itin.id}`)}
              className="w-full text-left p-4 rounded-xl border border-card-border bg-card-bg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {itin.title ?? itin.destination}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[status] ?? 'bg-surface text-muted'}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <button
                    type="button"
                    aria-label="일정 삭제"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(itin); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-danger hover:bg-surface transition-colors"
                  >
                    <span className="text-base leading-none">×</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted">
                {itin.startDate} ~ {itin.endDate} ({getDuration(itin.startDate, itin.endDate)})
              </p>
              <p className="text-xs text-muted mt-0.5">
                생성일: {new Date(itin.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="일정을 삭제할까요?"
        message={`'${deleteTarget?.title ?? deleteTarget?.destination ?? ''}' 일정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        busy={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
