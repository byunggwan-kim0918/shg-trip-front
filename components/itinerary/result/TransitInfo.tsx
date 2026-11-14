import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getTransportIcon } from '@/lib/constants/placeIcons';
import { formatDuration, isUnrealisticLeg } from '@/lib/utils/format';
import type { TransportType } from '@/lib/types/itinerary';

interface TransitInfoProps {
  mode: TransportType;
  duration: number | null;  // 분
  distance?: number | null; // km
}

export const MODE_LABEL: Record<TransportType, string> = {
  CAR: '차로',
  WALK: '걸어서',
  BUS: '버스로',
  SUBWAY: '지하철로',
  TRAIN: '열차로',
  TAXI: '택시로',
  BIKE: '자전거로',
  FLIGHT: '비행기로',
  DRIVE: '차로',
};

export default function TransitInfo({ mode, duration, distance }: TransitInfoProps) {
  const IconComponent = getTransportIcon(mode);
  const isUnrealistic = isUnrealisticLeg(mode, distance);

  return (
    <div className="flex items-center gap-2 py-2 pl-1 text-xs font-semibold text-muted-2">
      {React.createElement(IconComponent, { size: 15, 'aria-hidden': 'true' })}
      {duration != null && distance != null ? (
        <span className="tabular-nums">{MODE_LABEL[mode] ?? '이동'} {formatDuration(duration)} · {distance.toFixed(1)}km</span>
      ) : (
        <>
          {duration != null && <span>{formatDuration(duration)}</span>}
          {distance != null && <span className="tabular-nums">{distance.toFixed(1)}km</span>}
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
