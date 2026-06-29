'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { fetchItinerary } from '@/lib/data/itineraryService';
import { hasPendingStory } from '@/lib/types/itinerary';
import ResultLayout from '@/components/itinerary/result/ResultLayout';

// story 비동기 생성 폴링: 2.5초 간격, 최대 16회(~40초) 후 종료
const STORY_POLL_INTERVAL_MS = 2500;
const STORY_POLL_MAX_ATTEMPTS = 16;

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currentItinerary, setCurrentItinerary, refreshCurrentItinerary, setStoryPending } =
    useItineraryStore();
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

  // story 비동기 채움 폴링 — 구조 일정 먼저 도착 후 가이드북 문장(notes)이 채워지는 것을 반영.
  // storyPending 값은 notes가 채워질 때까지 true로 고정되므로 이 effect는 churn 없이 한 번만 동작한다.
  const storyPending = currentItinerary?.id === id && hasPendingStory(currentItinerary);
  useEffect(() => {
    if (!storyPending) { setStoryPending(false); return; }
    setStoryPending(true);

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const fresh = await fetchItinerary(id);
        refreshCurrentItinerary(fresh);
        if (!hasPendingStory(fresh) || attempts >= STORY_POLL_MAX_ATTEMPTS) {
          clearInterval(interval);
          setStoryPending(false);
        }
      } catch {
        if (attempts >= STORY_POLL_MAX_ATTEMPTS) {
          clearInterval(interval);
          setStoryPending(false);
        }
      }
    }, STORY_POLL_INTERVAL_MS);

    return () => { clearInterval(interval); setStoryPending(false); };
  }, [storyPending, id, refreshCurrentItinerary, setStoryPending]);

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
