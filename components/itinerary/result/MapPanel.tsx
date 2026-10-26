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
  /* 테마를 DOM이 아니라 store에서 읽는다.
   *
   * 예전엔 MutationObserver로 html.dark를 감시했다. 그런데 그 콜백은 toggleThemeWithTransition()의
   * apply()가 **끝난 뒤** 전달되고, 브라우저는 이미 apply() 직후 상태로 스냅샷을 잡아
   * 220ms 크로스페이드를 시작한다. 거기에 setIsDark가 flushSync도 아니어서 리렌더가 다음 프레임으로
   * 밀렸다 — 결과적으로 화면 전체가 어두워진 다음 지도만 뒤늦게 따라왔다.
   *
   * 테마는 이미 useAppStore에 있고, apply()가 classList 토글과 **같은 flushSync 안에서** 커밋한다.
   * 거기서 읽으면 지도 스타일 교체가 같은 스냅샷에 들어간다. */
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

  // min-h를 두지 않는다. 모바일 부모가 h-[180px] + overflow-hidden이라 min-h-[300px]이면
  // 아래 120px이 잘리고, 거기에 어트리뷰션 표시가 들어간다
  // (OSM 타일 정책·CARTO 약관 모두 저작자 표시 노출을 요구한다). 높이는 부모가 정한다.
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
