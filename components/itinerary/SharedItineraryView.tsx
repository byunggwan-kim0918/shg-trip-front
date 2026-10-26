'use client';

import { useState } from 'react';
import { groupStepsByDay } from '@/lib/types/itinerary';
import type { Itinerary } from '@/lib/types/itinerary';
import { nightsLabel } from '@/lib/utils/tripStatus';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import TimelinePanel from '@/components/itinerary/result/TimelinePanel';
import MapPanel from '@/components/itinerary/result/MapPanel';

interface Props {
  itinerary: Itinerary;
}

/**
 * 공유 일정 읽기 전용 뷰 (공개 페이지). 로그인 불필요.
 * ResultLayout의 편집·확정·store 로직을 제외한 뷰만 — TimelinePanel/MapPanel을 readOnly로 재사용.
 */
export default function SharedItineraryView({ itinerary }: Props) {
  const dayGroups = groupStepsByDay(itinerary.steps);
  const [selectedDay, setSelectedDay] = useState(dayGroups[0]?.dayNumber ?? 1);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [coverError, setCoverError] = useState(false);

  const { destination, startDate, endDate, tags, coverImage } = itinerary;
  const cover = proxyImageUrl(
    coverImage && /^https?:\/\//.test(coverImage) ? coverImage : itinerary.steps.find((s) => s.place?.imageUrl)?.place?.imageUrl ?? null,
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 헤더 (ResultLayout 헤더 축약, 액션 없음) */}
      <div className="flex items-start gap-4 border-b border-card-border bg-card-bg px-4 py-4 sm:px-6 sm:py-5">
        <div className="hidden h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl sm:block">
          {cover && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={itinerary.title ?? destination} className="h-full w-full object-cover" onError={() => setCoverError(true)} />
          ) : (
            // 사진 없으면 목적지 이니셜만. 형제 화면(ResultLayout)과 같은 처리 —
            // 글자 없는 그라데이션 사각형은 정보가 0이면서 헤더 좌측을 차지한다.
            <div className="flex h-full w-full items-center justify-center bg-surface-3">
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-muted">{destination.slice(0, 2)}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-2 text-[17px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[23px]">
            {itinerary.title ?? destination}
          </h1>
          <p className="mt-1.5 text-[13px] font-medium text-muted">
            {startDate} - {endDate} · {nightsLabel(startDate, endDate)}
          </p>
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-semibold text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-surface-3 px-3 py-1.5 text-xs font-semibold text-muted-2">
          공유된 일정
        </span>
      </div>

      {/* 본문: 모바일 지도 상단, lg 좌 타임라인 우 지도 */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 비율은 ResultLayout과 같이 유지한다 — 두 화면이 같은 레이아웃 문자열을 복제하고 있다. */}
        <div className="h-[180px] w-full shrink-0 overflow-hidden border-b border-card-border lg:order-2 lg:h-auto lg:w-[52%] lg:shrink lg:border-b-0 lg:border-l">
          <MapPanel
            steps={itinerary.steps}
            selectedDay={selectedDay}
            selectedStepId={selectedStepId}
            onMarkerClick={setSelectedStepId}
          />
        </div>
        <div className="w-full flex-1 overflow-y-auto lg:order-1 lg:w-[48%]">
          <TimelinePanel
            itinerary={itinerary}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onStepClick={setSelectedStepId}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
