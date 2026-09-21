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
  // 일차 구분은 기능이므로 카테고리 색을 쓴다. 단 Tailwind 기본 무지개(blue-600·indigo-600…)는
  // 브랜드와 무관한 AI tell이라, 색상환을 고르게 분배하고 채도를 낮춰(S 0.42~0.46)
  // 잉크 모노 팔레트 위에서 튀지 않게 설계했다.
  //
  // 1일차는 110°(맑은 초록)다. 브랜드 올리브(68°)를 그대로 쓰지 않은 이유:
  // 마커 채도(S~0.45)·명도(L~42%)로 내리면 68°는 카키로 읽히고, 지도 지형색(베이지·연녹)
  // 위에서 특히 탁해진다. 여기서는 브랜드 일치보다 **지도 위 식별**이 우선이라 초록을 유지한다.
  // (커버 그라데이션 대역을 100~210으로 좁힌 것과 같은 판단 — 카키 구간을 피한다)
  // bg=마커 채움 / border=한 단계 어둡게 / line=경로선 한 단계 밝게.
  { bg: '#7a8729', border: '#5f6a1e', line: '#98a733' }, // 1일차 = 브랜드 올리브(--status-ongoing과 동일 색상)
  { bg: '#3e7a98', border: '#2c5e77', line: '#4f97ba' }, // 2일차
  { bg: '#98643e', border: '#774b2c', line: '#ba7c4f' }, // 3일차
  { bg: '#643e98', border: '#4b2c77', line: '#7c4fba' }, // 4일차
  { bg: '#3e987a', border: '#2c775e', line: '#4fba97' }, // 5일차
  { bg: '#983e5c', border: '#772c45', line: '#ba4f73' }, // 6일차
  { bg: '#4d983e', border: '#39772c', line: '#61ba4f' }, // 7일차
  { bg: '#3e5598', border: '#2c3f77', line: '#4f6aba' }, // 8일차
  { bg: '#983e98', border: '#772c77', line: '#ba4fba' }, // 9일차
  { bg: '#3e9198', border: '#2c7177', line: '#4fb1ba' }, // 10일차
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
      {/* 다크모드 지도: mapId('dark-map')는 Google Cloud에 등록된 스타일이 있어야 동작하는데
          현재 등록돼 있지 않아 라이트 타일이 그대로 나온다(다크 화면에서 지도만 하얗게 튐).
          Cloud 설정 없이 코드만으로 해결하려면 타일에 필터를 건다. 마커·경로선은 우리가 그린
          오버레이라 같이 반전되면 안 되므로, 필터는 타일 레이어(.gm-style > div:first-child)에만 적용한다. */}
      <div className={`relative w-full h-full ${isDark ? 'map-dark' : ''}`}>
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
                      <div className="w-full h-24 rounded-[10px] mb-2 overflow-hidden bg-surface-3">
                        {step.place.imageUrl ? (
                          <img
                            src={proxyImageUrl(step.place.imageUrl)!}
                            alt={step.place.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          // imageUrl 아직 없음(비동기 업로드 대기) → skeleton
                          <div className="w-full h-full animate-pulse bg-black/10" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.bg }}
                        />
                        <span className="text-xs text-black/55">{step.dayNumber}일차</span>
                      </div>
                      <p className="font-semibold text-black/88">{step.place.name}</p>
                      <p className="text-black/55 text-xs mt-0.5">{step.place.address}</p>
                      <p style={{ color: color.bg }} className="text-xs mt-0.5">
                        {step.place.category}
                      </p>
                      {/* 별점은 데이터다. amber(경고 계열)나 상태색을 쓰지 않는다 */}
                      {step.place.rating != null && (
                        <div className="flex items-center gap-1 text-xs mt-0.5 text-black/70">
                          <Star size={12} className="fill-current" aria-hidden="true" />
                          <span>{step.place.rating}</span>
                        </div>
                      )}
                      {step.startTime && step.endTime && (
                        <p className="text-black/45 text-xs mt-0.5 tabular-nums">
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
          <div className="absolute top-3 left-3 bg-card-bg/90 backdrop-blur-sm rounded-xl shadow-md border border-card-border px-3 py-2 flex flex-col gap-1 z-10">
            {uniqueDays.map((day) => {
              const color = getDayColor(day);
              return (
                <div key={day} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color.bg }}
                  />
                  <span className="text-text-2">{day}일차</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </APIProvider>
  );
}
