'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { fetchItinerary } from '@/lib/data/itineraryService';
import ResultLayout from '@/components/itinerary/result/ResultLayout';

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currentItinerary, setCurrentItinerary } = useItineraryStore();
  const [notFound, setNotFound] = useState(false);
  // true로 초기화 — 첫 렌더에서 currentItinerary=null 상태로 ResultLayout이 노출되는 것을 방지
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) { setNotFound(true); setIsLoading(false); return; }
    // 이미 로드된 일정이면 재요청 생략
    if (currentItinerary?.id === id) { setIsLoading(false); return; }

    fetchItinerary(id)
      .then((itin) => setCurrentItinerary(itin))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, currentItinerary?.id, setCurrentItinerary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted text-sm">일정 불러오는 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted">일정을 찾을 수 없습니다</p>
        <button
          type="button"
          onClick={() => router.push('/main/my-trips')}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors min-h-[44px]"
        >
          내 일정함으로 이동
        </button>
      </div>
    );
  }

  return <ResultLayout />;
}
