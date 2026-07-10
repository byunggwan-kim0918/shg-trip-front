import { Star } from 'lucide-react';
import type { AlternativeOption } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { coverGradient } from '@/lib/utils/coverGradient';

interface AlternativeCardProps {
  alternative: AlternativeOption;
  isSelected: boolean;
  onSelect: () => void;
}

/** "이 시간대 대안" 미니카드 (4a). 썸네일44 + 이름 + ★평점·비용. */
export default function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const { place } = alternative;
  const img = proxyImageUrl(place.imageUrl);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
        isSelected ? 'border-accent bg-accent-soft' : 'border-card-border bg-surface-2 hover:bg-surface-hover'
      }`}
    >
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[9px]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={place.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="block h-full w-full" style={{ background: coverGradient(place.name) }} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-foreground">{place.name}</span>
        <span className="block text-[11.5px] text-muted-2">
          {place.rating != null && (
            <span className="inline-flex items-center gap-0.5">
              <Star size={9} className="fill-current text-status-done" aria-hidden="true" />
              {place.rating}
            </span>
          )}
          {place.rating != null && alternative.estimatedCost != null && ' · '}
          {alternative.estimatedCost != null && `${alternative.estimatedCost.toLocaleString()}원`}
        </span>
      </span>
    </button>
  );
}
