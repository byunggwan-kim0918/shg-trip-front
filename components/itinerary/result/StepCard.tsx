'use client';

import { useState } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import AlternativeList from './AlternativeList';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

const CATEGORY_ICONS: Record<string, string> = {
  attraction: '🏛️', restaurant: '🍽️', cafe: '☕',
  accommodation: '🏨', experience: '🎯', shopping: '🛍️',
  // 백엔드 한국어 카테고리 매핑
  '관광': '🏛️', '맛집': '🍽️', '카페': '☕',
  '숙소': '🏨', '액티비티': '🎯', '쇼핑': '🛍️',
};

interface StepCardProps {
  step: ItineraryStep;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onSelectAlternative?: (alternative: AlternativeOption) => void;
  dragListeners?: SyntheticListenerMap;
}

export default function StepCard({
  step,
  index,
  isExpanded,
  onToggleExpand,
  onClick,
  onSelectAlternative,
  dragListeners,
}: StepCardProps) {
  const place = step.place;
  const [imgError, setImgError] = useState(false);
  const imageUrl = proxyImageUrl(place?.imageUrl);

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
          <span className="text-xs text-muted cursor-grab" aria-label="드래그 핸들" {...dragListeners}>⠿</span>
          <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-semibold">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {place && <span>{CATEGORY_ICONS[place.category] ?? '📍'}</span>}
            <h3 className="text-sm font-semibold text-foreground truncate">
              {place?.name ?? '장소 정보 없음'}
            </h3>
          </div>
          {(step.startTime || step.endTime) && (
            <p className="text-xs text-muted mb-1">
              {step.startTime ?? ''}{step.startTime && step.endTime ? ' - ' : ''}{step.endTime ?? ''}
            </p>
          )}
          {step.notes && (
            <p className="text-xs text-muted line-clamp-2">{step.notes}</p>
          )}
          {step.estimatedCost != null && (
            <p className="text-xs text-muted mt-1">예상 비용: {step.estimatedCost.toLocaleString()}원</p>
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

        {/* 장소 썸네일 */}
        {imageUrl && !imgError && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={place?.name ?? '장소 사진'}
              className="w-16 h-16 rounded-lg object-cover"
              loading="lazy"
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
