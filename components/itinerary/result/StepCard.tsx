'use client';

import React, { useState } from 'react';
import { Clock, MapPinOff } from 'lucide-react';
import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { getCategoryIcon } from '@/lib/constants/placeIcons';
import AlternativeList from './AlternativeList';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

interface StepCardProps {
  step: ItineraryStep;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onSelectAlternative?: (alternative: AlternativeOption) => void;
}

export default function StepCard({
  step,
  index,
  isExpanded,
  onToggleExpand,
  onClick,
  onSelectAlternative,
}: StepCardProps) {
  const place = step.place;
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageUrl = proxyImageUrl(place?.imageUrl);
  const IconComponent = place ? getCategoryIcon(place.category) : null;
  const storyPending = useItineraryStore((s) => s.storyPending);
  const hasStory = !!step.notes && step.notes.trim().length > 0;
  // 좌표가 없거나 (0,0)이면 지도에 표시되지 않는다 (fallback 장소 등)
  const missingCoords = !!place && (place.latitude == null || place.longitude == null
    || (place.latitude === 0 && place.longitude === 0));

  return (
    <div
      className="border border-card-border rounded-xl bg-card-bg p-4 transition-shadow hover:shadow-sm cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-semibold">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {IconComponent && React.createElement(IconComponent, { size: 16, 'aria-hidden': 'true' })}
            <h3 className="text-sm font-semibold text-foreground truncate">
              {place?.name ?? '장소 정보 없음'}
            </h3>
          </div>
          {(step.startTime || step.endTime) && (
            <p className="text-xs text-muted mb-1">
              {step.startTime ?? ''}{step.startTime && step.endTime ? ' - ' : ''}{step.endTime ?? ''}
            </p>
          )}
          {hasStory ? (
            <p className="text-xs text-muted line-clamp-2">{step.notes}</p>
          ) : storyPending ? (
            <p className="text-xs text-muted/70 italic flex items-center gap-1.5 animate-pulse">
              <span aria-hidden="true">✨</span> 가이드 스토리를 작성하고 있어요…
            </p>
          ) : null}
          {step.estimatedCost != null && (
            <p className="text-xs text-muted mt-1">예상 비용: {step.estimatedCost.toLocaleString()}원</p>
          )}
          {place?.openingHours && (
            <p
              className="text-xs text-muted mt-1 line-clamp-1 flex items-center gap-1"
              title={place.openingHours}
            >
              <Clock size={11} aria-hidden="true" className="flex-shrink-0" />
              <span className="truncate">{place.openingHours}</span>
            </p>
          )}
          {step.userNotes && step.userNotes.trim().length > 0 && (
            <p className="text-xs text-foreground/80 mt-1 bg-surface rounded px-2 py-1">📝 {step.userNotes}</p>
          )}
          {missingCoords && (
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-amber-600 dark:text-amber-500">
              <MapPinOff size={11} aria-hidden="true" />
              지도 표시 불가 (위치 정보 없음)
            </span>
          )}

          {step.alternatives.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="mt-2 text-xs text-accent hover:underline min-h-[28px]"
            >
              {isExpanded ? '대안 접기 ▲' : `대안 ${step.alternatives.length}개 보기 ▼`}
            </button>
          )}
        </div>

        {/* 장소 썸네일 — 로딩 중 skeleton, 도착 시 fade-in (progressive reveal) */}
        <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
          {imageUrl && !imgError ? (
            <>
              {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200/70" />}
              <img
                src={imageUrl}
                alt={place?.name ?? '장소 사진'}
                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : imgError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MapPinOff className="w-5 h-5" />
            </div>
          ) : (
            // imageUrl 아직 없음(비동기 업로드 대기) → skeleton
            <div className="absolute inset-0 animate-pulse bg-gray-200/70" />
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
