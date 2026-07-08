'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import type { ItineraryStep } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/** 일차별 색상 팔레트 (최대 10일) */
const DAY_COLORS = [
  { bg: '#2563eb', border: '#1d4ed8', line: '#3b82f6' }, // 1일차 파랑
  { bg: '#dc2626', border: '#b91c1c', line: '#ef4444' }, // 2일차 빨강
  { bg: '#16a34a', border: '#15803d', line: '#22c55e' }, // 3일차 초록
  { bg: '#d97706', border: '#b45309', line: '#f59e0b' }, // 4일차 주황
  { bg: '#9333ea', border: '#7e22ce', line: '#a855f7' }, // 5일차 보라
  { bg: '#0891b2', border: '#0e7490', line: '#06b6d4' }, // 6일차 청록
  { bg: '#e11d48', border: '#be123c', line: '#f43f5e' }, // 7일차 로즈
  { bg: '#4f46e5', border: '#4338ca', line: '#6366f1' }, // 8일차 인디고
  { bg: '#0d9488', border: '#0f766e', line: '#14b8a6' }, // 9일차 틸
  { bg: '#c026d3', border: '#a21caf', line: '#d946ef' }, // 10일차 퓨시아
];

function getDayColor(dayNumber: number) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

/** 일차별 step 순서대로 Polyline을 그리는 컴포넌트 */
function DayPolylines({ steps }: { steps: ItineraryStep[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // dayNumber별로 그룹핑
    const byDay = new Map<number, ItineraryStep[]>();
    for (const step of steps) {
      if (!step.place) continue;
      const list = byDay.get(step.dayNumber) ?? [];
      list.push(step);
      byDay.set(step.dayNumber, list);
    }

    const polylines: google.maps.Polyline[] = [];

    byDay.forEach((daySteps, dayNumber) => {
      const sorted = daySteps.sort((a, b) => a.stepOrder - b.stepOrder);
      if (sorted.length < 2) return;

      const path = sorted.map((s) => ({
        lat: s.place!.latitude,
        lng: s.place!.longitude,
      }));

      const color = getDayColor(dayNumber);
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: color.line,
        strokeOpacity: 0.7,
        strokeWeight: 3,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: color.line,
              fillOpacity: 0.9,
              strokeWeight: 1,
              strokeColor: '#fff',
            },
            offset: '50%',
          },
        ],
      });
      polyline.setMap(map);
      polylines.push(polyline);
    });

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, steps]);

  return null;
}

/** 선택된 step으로 pan하는 컨트롤러 */
function MapController({
  steps,
  selectedStepId,
}: {
  steps: ItineraryStep[];
  selectedStepId: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || selectedStepId == null) return;
    const step = steps.find((s) => s.id === selectedStepId);
    if (step?.place) {
      map.panTo({ lat: step.place.latitude, lng: step.place.longitude });
      map.setZoom(15);
    }
  }, [map, selectedStepId, steps]);

  return null;
}

/** 일차별 step 내 순서 번호 계산 */
function useDayStepIndex(steps: ItineraryStep[]) {
  return useMemo(() => {
    const indexMap = new Map<number, number>();
    const dayCounters = new Map<number, number>();
    for (const step of [...steps].sort((a, b) => a.stepOrder - b.stepOrder)) {
      const count = (dayCounters.get(step.dayNumber) ?? 0) + 1;
      dayCounters.set(step.dayNumber, count);
      indexMap.set(step.id, count);
    }
    return indexMap;
  }, [steps]);
}

interface MapPanelInnerProps {
  steps: ItineraryStep[];
  selectedStepId: number | null;
  onMarkerClick: (stepId: number) => void;
  isDark: boolean;
}

export default function MapPanelInner({
  steps,
  selectedStepId,
  onMarkerClick,
  isDark,
}: MapPanelInnerProps) {
  const [infoStepId, setInfoStepId] = useState<number | null>(null);
  const dayStepIndex = useDayStepIndex(steps);

  const firstPlace = steps[0]?.place;
  const center = firstPlace
    ? { lat: firstPlace.latitude, lng: firstPlace.longitude }
    : { lat: 37.5665, lng: 126.978 };

  const handleMarkerClick = useCallback(
    (stepId: number) => {
      onMarkerClick(stepId);
      setInfoStepId((prev) => (prev === stepId ? null : stepId));
    },
    [onMarkerClick],
  );

  // 고유 일차 목록 (범례용)
  const uniqueDays = useMemo(() => {
    const days = new Set(steps.map((s) => s.dayNumber));
    return Array.from(days).sort((a, b) => a - b);
  }, [steps]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="relative w-full h-full">
        <GoogleMap
          mapId={isDark ? 'dark-map' : 'light-map'}
          defaultCenter={center}
          defaultZoom={13}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
        >
          <MapController steps={steps} selectedStepId={selectedStepId} />
          <DayPolylines steps={steps} />

          {steps.map((step) => {
            if (!step.place) return null;
            const isSelected = step.id === selectedStepId;
            const color = getDayColor(step.dayNumber);
            const indexInDay = dayStepIndex.get(step.id) ?? 0;

            return (
              <div key={step.id}>
                <AdvancedMarker
                  position={{ lat: step.place.latitude, lng: step.place.longitude }}
                  onClick={() => handleMarkerClick(step.id)}
                  zIndex={isSelected ? 10 : 1}
                >
                  <div
                    className="flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md border-2 transition-transform"
                    style={{
                      width: isSelected ? 36 : 28,
                      height: isSelected ? 36 : 28,
                      backgroundColor: color.bg,
                      borderColor: isSelected ? '#fff' : color.border,
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {indexInDay}
                  </div>
                </AdvancedMarker>

                {infoStepId === step.id && (
                  <InfoWindow
                    position={{ lat: step.place.latitude, lng: step.place.longitude }}
                    onCloseClick={() => setInfoStepId(null)}
                    pixelOffset={[0, -40]}
                  >
                    <div className="text-sm min-w-[180px] max-w-[220px]">
                      <div className="w-full h-24 rounded-md mb-2 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                        {step.place.imageUrl ? (
                          <img
                            src={proxyImageUrl(step.place.imageUrl)!}
                            alt={step.place.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          // imageUrl 아직 없음(비동기 업로드 대기) → skeleton
                          <div className="w-full h-full animate-pulse bg-gray-200/70" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.bg }}
                        />
                        <span className="text-xs text-gray-500">{step.dayNumber}일차</span>
                      </div>
                      <p className="font-semibold text-gray-900">{step.place.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{step.place.address}</p>
                      <p style={{ color: color.bg }} className="text-xs mt-0.5">
                        {step.place.category}
                      </p>
                      {step.place.rating != null && (
                        <div className="flex items-center gap-1 text-xs mt-0.5 text-amber-400">
                          <Star size={12} className="fill-amber-400" aria-hidden="true" />
                          <span>{step.place.rating}</span>
                        </div>
                      )}
                      {step.startTime && step.endTime && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          {step.startTime} - {step.endTime}
                        </p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </div>
            );
          })}
        </GoogleMap>

        {/* 일차별 범례 */}
        {uniqueDays.length > 1 && (
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 flex flex-col gap-1 z-10">
            {uniqueDays.map((day) => {
              const color = getDayColor(day);
              return (
                <div key={day} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color.bg }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{day}일차</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </APIProvider>
  );
}
