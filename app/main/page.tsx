'use client';

import { useEffect, useState } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import TripChat from '@/components/trip-chat/TripChat';
import ItineraryList from '@/components/dashboard/ItineraryList';

export default function MainPage() {
  const { itineraries, loadItineraries, isLoading: listLoading } = useItineraryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    loadItineraries()
      .catch(() => setError('일정 목록을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [loadItineraries]);

  // 사이드바가 먼저 목록을 부르면 여기 호출은 바로 끝난다. 그 사이 빈 목록으로 보고 대화를 열면 세션이 생긴다.
  if (isLoading || listLoading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="animate-spin w-8 h-8 border-3 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-4">
        <p className="text-muted">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            loadItineraries()
              .catch(() => setError('일정 목록을 불러오는데 실패했습니다.'))
              .finally(() => setIsLoading(false));
          }}
          className="px-4 py-2 rounded-[10px] bg-accent text-accent-fg text-sm"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return <TripChat focusSlot={null} />;
  }

  return <ItineraryList itineraries={itineraries} />;
}
