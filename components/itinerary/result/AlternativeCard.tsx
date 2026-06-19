import React from 'react';
import { Star } from 'lucide-react';
import { getCategoryIcon } from '@/lib/constants/placeIcons';
import type { AlternativeOption } from '@/lib/types/itinerary';

interface AlternativeCardProps {
  alternative: AlternativeOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const { place } = alternative;
  const IconComponent = getCategoryIcon(place.category);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left p-3 rounded-lg border transition-colors min-h-[44px]
        ${isSelected
          ? 'border-accent bg-accent-soft'
          : 'border-card-border bg-card-bg hover:bg-surface-hover'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        {React.createElement(IconComponent, { size: 16, 'aria-hidden': 'true' })}
        <span className="text-sm font-medium text-foreground">{place.name}</span>
        {place.rating != null && (
          <div className="flex items-center gap-1 text-xs text-muted ml-auto">
            <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            <span>{place.rating}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted line-clamp-1">{place.address}</p>
      {alternative.notes && (
        <p className="text-xs text-muted mt-1 line-clamp-2">{alternative.notes}</p>
      )}
      {alternative.estimatedCost != null && (
        <p className="text-xs text-muted mt-0.5">예상 비용: {alternative.estimatedCost.toLocaleString()}원</p>
      )}
    </button>
  );
}
