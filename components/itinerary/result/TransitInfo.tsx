import type { TransportType } from '@/lib/types/itinerary';

const TRANSPORT_ICONS: Record<TransportType, string> = {
  WALK: '🚶',
  BUS: '🚌',
  TRAIN: '🚆',
  SUBWAY: '🚇',
  TAXI: '🚕',
  CAR: '🚗',
  BIKE: '🚲',
  FLIGHT: '✈️',
};

interface TransitInfoProps {
  mode: TransportType;
  duration: number | null;  // 분
  distance?: number | null; // km
}

export default function TransitInfo({ mode, duration, distance }: TransitInfoProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-8 text-xs text-muted">
      <span className="border-l-2 border-dashed border-card-border h-4" />
      <span>{TRANSPORT_ICONS[mode] ?? '🚶'}</span>
      {duration != null && <span>{duration}분</span>}
      {distance != null && <span>({distance.toFixed(1)}km)</span>}
    </div>
  );
}
