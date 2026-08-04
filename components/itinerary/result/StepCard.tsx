'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPinOff, Sparkles, Star, ChevronDown, ChevronUp } from 'lucide-react';
import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { getCategoryIcon } from '@/lib/constants/placeIcons';
import AlternativeList from './AlternativeList';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { coverGradient } from '@/lib/utils/coverGradient';

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

  return (
    <div
      className={`rounded-2xl bg-card-bg p-4 transition-shadow ${editMode ? 'cursor-default' : 'cursor-pointer'} ${
        isExpanded
          ? 'border-[1.5px] border-accent shadow-[0_10px_26px_-18px_var(--accent)]'
          : 'border border-card-border hover:shadow-sm'
      }`}
      onClick={editMode ? undefined : onClick}
      role={editMode ? undefined : 'button'}
      tabIndex={editMode ? undefined : 0}
      onKeyDown={editMode ? undefined : (e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex gap-3.5">
        <div className="min-w-0 flex-1">
          {/* 제목 + 평점 */}
          <div className="mb-1.5 flex items-center gap-1.5">
            {IconComponent && React.createElement(IconComponent, { size: 15, className: 'shrink-0 text-accent', 'aria-hidden': 'true' })}
            <h3 className="truncate text-[15px] font-bold text-foreground">
              {place?.name ?? '장소 정보 없음'}
            </h3>
            {rating != null && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-status-done-bg px-1.5 py-0.5 text-[11px] font-bold text-status-done">
                <Star size={9} className="fill-current" aria-hidden="true" /> {rating}
              </span>
            )}
          </div>

          {/* 시간 */}
          {(step.startTime || step.endTime) && (
            <p className="mb-1.5 text-[12.5px] font-bold text-accent">
              {step.startTime ?? ''}{step.startTime && step.endTime ? ' – ' : ''}{step.endTime ?? ''}
            </p>
          )}

          {/* 스토리 */}
          {hasStory ? (
            <p className="text-[13px] leading-relaxed text-text-2 line-clamp-3">{step.notes}</p>
          ) : storyPending ? (
            <p className="flex items-center gap-1.5 text-xs italic text-muted-2 animate-pulse">
              <Sparkles size={11} aria-hidden="true" /> 가이드 스토리를 작성하고 있어요…
            </p>
          ) : null}

          {/* 영업시간 */}
          {place?.openingHours && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-2 line-clamp-1" title={place.openingHours}>
              <Clock size={11} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{place.openingHours}</span>
            </p>
          )}

          {step.userNotes && step.userNotes.trim().length > 0 && (
            <p className="mt-1.5 rounded bg-surface-3 px-2 py-1 text-xs text-text-2">{step.userNotes}</p>
          )}

          {missingCoords && (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-warn-fg">
              <MapPinOff size={11} aria-hidden="true" /> 지도 표시 불가 (위치 정보 없음)
            </span>
          )}

          {/* 비용 + 대안 */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[12.5px] font-semibold text-muted">
              예상 비용 <b className="text-foreground">{(step.estimatedCost ?? 0).toLocaleString()}원</b>
            </span>
            {!readOnly && !editMode && step.alternatives.length > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
                className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-accent hover:underline"
              >
                {isExpanded ? (
                  <>대안 접기 <ChevronUp size={13} aria-hidden="true" /></>
                ) : (
                  <>대안 {step.alternatives.length}개 보기 <ChevronDown size={13} aria-hidden="true" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 썸네일 96 */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          {imageUrl && !imgError ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-surface-3" />}
              <img
                src={imageUrl}
                alt={place?.name ?? '장소 사진'}
                className={`h-full w-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            // 실이미지 없으면 장소명 hue 그라데이션 (일관된 커버)
            <div
              className="h-full w-full"
              style={{ background: coverGradient(place?.name ?? place?.category ?? 'place') }}
            />
          )}
        </div>
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
