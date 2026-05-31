import type { AlternativeOption } from '@/lib/types/itinerary';

const CATEGORY_ICONS: Record<string, string> = {
  attraction: '🏛️', restaurant: '🍽️', cafe: '☕',
  accommodation: '🏨', experience: '🎯', shopping: '🛍️',
  '관광': '🏛️', '맛집': '🍽️', '카페': '☕',
  '숙소': '🏨', '액티비티': '🎯', '쇼핑': '🛍️',
};

interface AlternativeCardProps {
  alternative: AlternativeOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const { place } = alternative;
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
        <span className="text-sm">{CATEGORY_ICONS[place.category] ?? '📍'}</span>
        <span className="text-sm font-medium text-foreground">{place.name}</span>
        {place.rating != null && (
          <span className="text-xs text-muted ml-auto">⭐ {place.rating}</span>
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
