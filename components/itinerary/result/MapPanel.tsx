'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { ItineraryStep } from '@/lib/types/itinerary';
import { useAppStore } from '@/lib/stores';

const MapPanelInner = dynamic(() => import('./MapPanelInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-2 text-muted text-sm">
      지도 불러오는 중...
    </div>
  ),
});

interface MapPanelProps {
  steps: ItineraryStep[];
  selectedDay?: number;
  selectedStepId: number | null;
  onMarkerClick: (stepId: number) => void;
}

export default function MapPanel({ steps, selectedDay, selectedStepId, onMarkerClick }: MapPanelProps) {
  /* MutationObserver 콜백은 테마 전환 스냅샷 뒤에 와서 지도만 늦게 바뀐다.
   * store 값은 apply()가 classList 토글과 같은 flushSync 안에서 커밋하므로 같은 스냅샷에 들어간다. */
  const isDark = useAppStore((s) => s.theme === 'dark');

  const mappableSteps = steps.filter(
    (s) => s.place != null && s.place.latitude != null && s.place.longitude != null
      && s.place.latitude !== 0 && s.place.longitude !== 0,
  );

  const filteredSteps = selectedDay
    ? mappableSteps.filter((s) => s.dayNumber === selectedDay)
    : mappableSteps;

  if (filteredSteps.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-2 text-muted text-sm">
        <div className="text-center">
          <MapPin size={24} className="mx-auto mb-2" aria-hidden="true" />
          <p>장소 좌표 정보가 없어 지도를 표시할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 모바일 부모가 h-[180px] + overflow-hidden이라 min-h를 두면 하단 어트리뷰션이 잘린다.
  // 타일 약관(OSM·OpenFreeMap)이 저작자 표시 노출을 요구하므로 높이는 부모가 정한다.
  return (
    <div className="w-full h-full">
      <MapPanelInner
        steps={filteredSteps}
        selectedStepId={selectedStepId}
        onMarkerClick={onMarkerClick}
        isDark={isDark}
      />
    </div>
  );
}
