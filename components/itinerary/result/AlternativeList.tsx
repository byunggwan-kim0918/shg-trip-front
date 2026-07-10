import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import AlternativeCard from './AlternativeCard';

interface AlternativeListProps {
  step: ItineraryStep;
  currentPlaceId: number | null;
  onSelect: (alternative: AlternativeOption) => void;
}

/** "이 시간대 대안" 영역 (4a). 점선 구분 + 미니카드 나열. */
export default function AlternativeList({ step, currentPlaceId, onSelect }: AlternativeListProps) {
  return (
    <div className="mt-3.5 border-t border-dashed border-card-border pt-3.5 animate-fade-in-up">
      <p className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">이 시간대 대안</p>
      <div className="flex flex-wrap gap-2.5">
        {step.alternatives.map((alt) => (
          <AlternativeCard
            key={alt.id}
            alternative={alt}
            isSelected={currentPlaceId === alt.place.id}
            onSelect={() => onSelect(alt)}
          />
        ))}
      </div>
    </div>
  );
}
