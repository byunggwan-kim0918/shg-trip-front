'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPinOff, Sparkles, Star, ChevronDown, ChevronUp } from 'lucide-react';
import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { getCategoryIcon } from '@/lib/constants/placeIcons';
import AlternativeList from './AlternativeList';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { formatOpeningHours } from '@/lib/utils/openingHours';

interface StepCardProps {
  step: ItineraryStep;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onSelectAlternative?: (alternative: AlternativeOption) => void;
  /** 읽기 전용(공유 공개 뷰). 대안 보기 버튼 숨김 + store 미구독. */
  readOnly?: boolean;
  /** 편집 모드(F3 드래그·삭제). 카드 클릭·대안 버튼 비활성(드래그와 충돌 방지). */
  editMode?: boolean;
}

export default function StepCard({
  step,
  isExpanded,
  onToggleExpand,
  onClick,
  onSelectAlternative,
  readOnly = false,
  editMode = false,
}: StepCardProps) {
  const place = step.place;
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageUrl = proxyImageUrl(place?.imageUrl);

  // 대안 선택 시 같은 step.id로 place만 교체되면 StepCard 인스턴스가 재사용되어
  // 이전 이미지의 로드/에러 상태가 남는다. imageUrl이 바뀌면 상태를 초기화한다.
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [imageUrl]);
  const IconComponent = place ? getCategoryIcon(place.category) : null;
  // 공유 뷰(readOnly)는 store에 의존하지 않음 — storyPending 항상 false 취급.
  const storyPendingFromStore = useItineraryStore((s) => s.storyPending);
  const storyPending = readOnly ? false : storyPendingFromStore;
  const hasStory = !!step.notes && step.notes.trim().length > 0;
  const missingCoords = !!place && (place.latitude == null || place.longitude == null
    || (place.latitude === 0 && place.longitude === 0));
  const rating = place?.rating;

  const timeRange = [step.startTime, step.endTime].filter(Boolean).join(' - ');

  return (
    <div
      /* 평상시 배경을 둔다. 보더·그림자·p-5짜리 카드 박스로 돌아가는 게 아니라
         캔버스(--background) 위의 흰 행으로만 만든다 — 패딩은 그대로이므로 밀도는 유지된다.
         배경이 없을 때는 스톱과 그 아래 이동 정보("차로 5분 · 3.0km")의 간격이
         다음 스톱과의 간격과 거의 같아서, 이동 정보가 어느 스톱에 속하는지 읽히지 않았다. */
      className={`relative rounded-[10px] px-3.5 py-3 transition-colors ${editMode ? 'cursor-default' : 'cursor-pointer'} ${
        isExpanded ? 'bg-accent-soft' : 'bg-card-bg hover:bg-surface-hover'
      }`}
      onClick={editMode ? undefined : onClick}
      role={editMode ? undefined : 'button'}
      tabIndex={editMode ? undefined : 0}
      onKeyDown={editMode ? undefined : (e) => e.key === 'Enter' && onClick()}
    >
      {/* 선택 표시는 테두리가 아니라 왼쪽 띠로. 카드 박스를 없앤 뒤에도 "지금 보는 스톱"이 분명하다. */}
      {isExpanded && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent" aria-hidden="true" />}

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          {/* 1행: 시작 시각 · 장소명 · 평점. 시각을 제목과 같은 줄에 두면 세로로 훑인다. */}
          <div className="flex items-baseline gap-2">
            {step.startTime && (
              <span className="shrink-0 text-[13px] font-extrabold tabular-nums text-accent-weak-fg">{step.startTime}</span>
            )}
            {IconComponent && React.createElement(IconComponent, { size: 14, className: 'shrink-0 translate-y-[2px] text-muted', 'aria-hidden': 'true' })}
            <h3 className="truncate text-[15px] font-bold text-foreground">
              {place?.name ?? '장소 정보 없음'}
            </h3>
            {rating != null && (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold tabular-nums text-muted">
                <Star size={9} className="fill-current" aria-hidden="true" />{rating}
              </span>
            )}
          </div>

          {/* 2행: 스토리 */}
          {hasStory ? (
            <p className="mt-1 line-clamp-2 max-w-[560px] text-[13px] leading-[1.55] text-text-2">{step.notes}</p>
          ) : storyPending ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs italic text-muted-2 animate-pulse">
              <Sparkles size={11} aria-hidden="true" /> 가이드 스토리를 작성하고 있어요…
            </p>
          ) : null}

          {/* 3행: 메타를 한 줄로 압축. 예전엔 시간·영업시간·비용·대안이 각각 한 줄씩 4줄을 먹었다. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-2">
            {timeRange && <span className="tabular-nums">{timeRange}</span>}
            {place?.openingHours && (
              <span className="inline-flex items-center gap-1 tabular-nums" title={place.openingHours}>
                <Clock size={10} className="shrink-0" aria-hidden="true" />
                {formatOpeningHours(place.openingHours)}
              </span>
            )}
            <span className="tabular-nums">
              예상 <b className="font-bold text-text-2">{(step.estimatedCost ?? 0).toLocaleString()}원</b>
            </span>
            {!readOnly && !editMode && step.alternatives.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="inline-flex items-center gap-0.5 text-[11px] font-bold text-accent-weak-fg hover:underline"
              >
                {isExpanded ? (
                  <>대안 접기 <ChevronUp size={12} aria-hidden="true" /></>
                ) : (
                  <>대안 {step.alternatives.length}개 <ChevronDown size={12} aria-hidden="true" /></>
                )}
              </button>
            )}
          </div>

          {step.userNotes && step.userNotes.trim().length > 0 && (
            <p className="mt-1.5 rounded-lg bg-surface-3 px-2 py-1 text-[11px] text-text-2">{step.userNotes}</p>
          )}

          {missingCoords && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-warn-fg">
              <MapPinOff size={11} aria-hidden="true" /> 지도 표시 불가 (위치 정보 없음)
            </span>
          )}
        </div>

        {/* 썸네일. 사진이 있을 때만 렌더한다 — 없을 때 블록으로 채우면 정보 0인 면이 리스트를 지배한다. */}
        {imageUrl && !imgError && (
          <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px]">
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-surface-3" />}
            <img
              src={imageUrl}
              alt={place?.name ?? '장소 사진'}
              className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        )}
      </div>

      {isExpanded && onSelectAlternative && (
        <AlternativeList
          step={step}
          currentPlaceId={place?.id ?? null}
          onSelect={onSelectAlternative}
        />
      )}
    </div>
  );
}
