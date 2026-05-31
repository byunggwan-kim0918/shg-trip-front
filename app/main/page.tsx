'use client';

import { useEffect, useState } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';
import ItineraryList from '@/components/dashboard/ItineraryList';

export default function MainPage() {
  const { itineraries, loadItineraries } = useItineraryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    loadItineraries()
      .catch(() => setError('일정 목록을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [loadItineraries]);

  if (isLoading) {
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
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return <EmptyDashboard />;
  }

  return <ItineraryList itineraries={itineraries} />;
}
