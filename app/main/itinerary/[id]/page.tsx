'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { fetchItinerary } from '@/lib/data/itineraryService';
import { hasPendingStory, hasPendingImage } from '@/lib/types/itinerary';
import ResultLayout from '@/components/itinerary/result/ResultLayout';

// 비동기 생성 폴링(story 문장 + 장소 사진): 2.5초 간격, 최대 16회(~40초) 후 종료.
// 이미지 업로드가 더 오래 걸리면 STORY_POLL_MAX_ATTEMPTS를 24(~60초)로 상향 가능.
const STORY_POLL_INTERVAL_MS = 2500;
const STORY_POLL_MAX_ATTEMPTS = 16;

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { currentItinerary, setCurrentItinerary, applyAsyncFill, setStoryPending } =
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

  // 비동기 채움 폴링 — 구조 일정 먼저 도착 후 가이드북 문장(notes)과 장소 사진(imageUrl)이
  // 채워지는 것을 반영한다. story 또는 image 중 하나라도 pending이면 폴링을 계속한다.
  // 단 store 플래그(setStoryPending)는 story 의미만 유지해 "생성 중" 표시가 이미지 대기로 오래 켜지지 않게 한다.
  const isTarget = currentItinerary?.id === id;
  const storyPending = isTarget && hasPendingStory(currentItinerary);
  const contentPending = isTarget && (hasPendingStory(currentItinerary) || hasPendingImage(currentItinerary));
  useEffect(() => {
    setStoryPending(storyPending);
    if (!contentPending) return;

    let attempts = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    // 한 번의 폴링 tick: 재조회 후 pending 해소 여부 판정. 종료 시 true 반환.
    const poll = async (): Promise<boolean> => {
      attempts += 1;
      try {
        const fresh = await fetchItinerary(id);
        if (cancelled) return true;
        // 편집(재정렬/삭제) 결과를 되돌리지 않도록 순서/집합은 보존하고 채움 필드만 머지.
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

    // 첫 회는 2.5초 기다리지 않고 즉시 실행 — 이미지/story가 이미 준비된 경우 팝인 gap 최소화.
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
