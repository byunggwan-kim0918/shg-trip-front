'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { ItineraryStep } from '@/lib/types/itinerary';

const MapPanelInner = dynamic(() => import('./MapPanelInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface text-muted text-sm">
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const mappableSteps = steps.filter(
    (s) => s.place != null && s.place.latitude != null && s.place.longitude != null
      && s.place.latitude !== 0 && s.place.longitude !== 0,
  );

  const filteredSteps = selectedDay
    ? mappableSteps.filter((s) => s.dayNumber === selectedDay)
    : mappableSteps;

  if (filteredSteps.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-surface text-muted text-sm">
        <div className="text-center">
          <p className="text-lg mb-1">📍</p>
          <p>장소 좌표 정보가 없어 지도를 표시할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px]">
      <MapPanelInner
        steps={filteredSteps}
        selectedStepId={selectedStepId}
        onMarkerClick={onMarkerClick}
        isDark={isDark}
      />
    </div>
  );
}
