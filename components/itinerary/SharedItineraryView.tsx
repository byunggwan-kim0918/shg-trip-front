'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPinned, Sparkles } from 'lucide-react';
import { groupStepsByDay } from '@/lib/types/itinerary';
import type { Itinerary } from '@/lib/types/itinerary';
import { nightsLabel } from '@/lib/utils/tripStatus';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import TimelinePanel from '@/components/itinerary/result/TimelinePanel';
import MapPanel from '@/components/itinerary/result/MapPanel';
import Logo from '@/components/common/Logo';
import EmptyState from '@/components/common/EmptyState';

interface Props {
  itinerary: Itinerary;
}

/** ResultLayout의 편집·확정·store 로직 없이 TimelinePanel/MapPanel을 readOnly로 재사용한다. */
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
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* 링크를 받은 사람이 서비스로 들어올 수 있는 유일한 입구 */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-card-border bg-card-bg px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Logo size={24} />
          <span className="text-[13px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-xs font-bold text-accent-fg transition-[filter] hover:brightness-105"
        >
          <Sparkles size={13} aria-hidden="true" /> 나도 여행 일정 만들기
        </Link>
      </div>

      <div className="flex items-start gap-4 border-b border-card-border bg-card-bg px-4 py-4 sm:px-6 sm:py-5">
        <div className="hidden h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl sm:block">
          {cover && !coverError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={itinerary.title ?? destination} className="h-full w-full object-cover" onError={() => setCoverError(true)} />
          ) : (
            // 글자 없는 그라데이션 사각형은 정보 없이 헤더 좌측만 차지하므로
            // ResultLayout처럼 목적지 이니셜만 둔다.
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

      {itinerary.steps.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <EmptyState
            icon={MapPinned}
            title="아직 담긴 장소가 없어요"
            description="이 일정에는 방문할 장소가 없어요."
            className="w-full max-w-sm"
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* ResultLayout과 같은 레이아웃 문자열을 복제하고 있어 비율을 같이 고쳐야 한다. */}
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
      )}
    </div>
  );
}
