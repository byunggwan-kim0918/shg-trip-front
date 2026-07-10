import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getTransportIcon } from '@/lib/constants/placeIcons';
import { formatDuration, UNREALISTIC_LEG_KM } from '@/lib/utils/format';
import type { TransportType } from '@/lib/types/itinerary';

interface TransitInfoProps {
  mode: TransportType;
  duration: number | null;  // 분
  distance?: number | null; // km
}

export default function TransitInfo({ mode, duration, distance }: TransitInfoProps) {
  const IconComponent = getTransportIcon(mode);
  const isUnrealistic = distance != null && distance > UNREALISTIC_LEG_KM;

  return (
    <div className="flex items-center gap-2 py-2 pl-1 text-[12.5px] font-semibold text-muted-2">
      {React.createElement(IconComponent, { size: 15, 'aria-hidden': 'true' })}
      {duration != null && distance != null ? (
        <span>차로 {formatDuration(duration)} · {distance.toFixed(1)}km</span>
      ) : (
        <>
          {duration != null && <span>{formatDuration(duration)}</span>}
          {distance != null && <span>{distance.toFixed(1)}km</span>}
        </>
      )}
      {isUnrealistic && (
        <span
          className="inline-flex items-center gap-1 text-warn-fg"
          title="이동 거리가 비정상적으로 큽니다. 장소 위치 정보가 정확하지 않을 수 있어요."
        >
          <AlertTriangle size={12} aria-hidden="true" />
          위치 확인 필요
        </span>
      )}
    </div>
  );
}
