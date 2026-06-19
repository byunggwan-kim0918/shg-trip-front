import React from 'react';
import { getTransportIcon } from '@/lib/constants/placeIcons';
import type { TransportType } from '@/lib/types/itinerary';

interface TransitInfoProps {
  mode: TransportType;
  duration: number | null;  // 분
  distance?: number | null; // km
}

export default function TransitInfo({ mode, duration, distance }: TransitInfoProps) {
  const IconComponent = getTransportIcon(mode);
  return (
    <div className="flex items-center gap-2 py-2 px-8 text-xs text-muted">
      <span className="border-l-2 border-dashed border-card-border h-4" />
      {React.createElement(IconComponent, { size: 14, 'aria-hidden': 'true' })}
      {duration != null && <span>{duration}분</span>}
      {distance != null && <span>({distance.toFixed(1)}km)</span>}
    </div>
  );
}
