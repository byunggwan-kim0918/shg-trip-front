import type { AlternativeOption, ItineraryStep } from '@/lib/types/itinerary';
import AlternativeCard from './AlternativeCard';

interface AlternativeListProps {
  step: ItineraryStep;
  currentPlaceId: number | null;
  onSelect: (alternative: AlternativeOption) => void;
}

export default function AlternativeList({ step, currentPlaceId, onSelect }: AlternativeListProps) {
  return (
    <div className="mt-2 ml-9 space-y-2 animate-fade-in-up">
      <p className="text-xs text-muted font-medium">대안 옵션</p>
      {step.alternatives.map((alt) => (
        <AlternativeCard
          key={alt.id}
          alternative={alt}
          isSelected={currentPlaceId === alt.place.id}
          onSelect={() => onSelect(alt)}
        />
      ))}
    </div>
  );
}
