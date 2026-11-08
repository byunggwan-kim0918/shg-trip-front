'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { fetchItinerary } from '@/lib/data/itineraryService';
import { hasPendingStory, hasPendingImage } from '@/lib/types/itinerary';
import ResultLayout from '@/components/itinerary/result/ResultLayout';
import EmptyState from '@/components/common/EmptyState';
import { MapPinOff } from 'lucide-react';

// story 문장과 장소 사진은 비동기로 채워지므로 약 40초 동안 재조회한다.
const STORY_POLL_INTERVAL_MS = 2500;
const STORY_POLL_MAX_ATTEMPTS = 16;

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currentItinerary, setCurrentItinerary, applyAsyncFill, setStoryPending } =
    useItineraryStore();
  const [notFound, setNotFound] = useState(false);
  // false로 시작하면 첫 렌더에 currentItinerary=null인 ResultLayout이 노출된다.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) { setNotFound(true); setIsLoading(false); return; }
    if (currentItinerary?.id === id) { setIsLoading(false); return; }

    fetchItinerary(id)
      .then((itin) => setCurrentItinerary(itin))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, currentItinerary?.id, setCurrentItinerary]);

  // story나 image 중 하나라도 pending이면 폴링을 계속한다.
  // setStoryPending은 story만 반영해야 "생성 중" 표시가 이미지 대기로 오래 켜지지 않는다.
  const isTarget = currentItinerary?.id === id;
  const storyPending = isTarget && hasPendingStory(currentItinerary);
  const contentPending = isTarget && (hasPendingStory(currentItinerary) || hasPendingImage(currentItinerary));
  useEffect(() => {
    setStoryPending(storyPending);
    if (!contentPending) return;

    let attempts = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    // 폴링을 끝내야 하면 true.
    const poll = async (): Promise<boolean> => {
      attempts += 1;
      try {
        const fresh = await fetchItinerary(id);
        if (cancelled) return true;
        // 편집(재정렬/삭제) 결과를 되돌리지 않게 순서·집합은 두고 채움 필드만 머지한다.
        applyAsyncFill(fresh);
        setStoryPending(hasPendingStory(fresh));
        const stillPending = hasPendingStory(fresh) || hasPendingImage(fresh);
        if (!stillPending || attempts >= STORY_POLL_MAX_ATTEMPTS) {
          setStoryPending(false);
          return true;
        }
      } catch {
        if (attempts >= STORY_POLL_MAX_ATTEMPTS) {
          setStoryPending(false);
          return true;
        }
      }
      return false;
    };

    // 이미 준비된 경우 사진·문장이 늦게 뜨지 않게 첫 회는 기다리지 않는다.
    void poll().then((done) => {
      if (done || cancelled) return;
      interval = setInterval(async () => {
        if (await poll()) clearInterval(interval);
      }, STORY_POLL_INTERVAL_MS);
    });

    return () => { cancelled = true; if (interval) clearInterval(interval); };
  }, [contentPending, storyPending, id, applyAsyncFill, setStoryPending]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted text-sm">일정 불러오는 중...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState
          icon={MapPinOff}
          title="일정을 찾을 수 없어요"
          description="삭제됐거나 주소가 잘못됐어요."
          actionLabel="내 일정함으로 이동"
          onAction={() => router.push('/main/my-trips')}
          className="w-full max-w-sm"
        />
      </div>
    );
  }

  return <ResultLayout />;
}
