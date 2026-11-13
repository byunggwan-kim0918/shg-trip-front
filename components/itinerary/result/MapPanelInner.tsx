'use client';

import { useEffect, useCallback, useState, useMemo, useRef, Fragment } from 'react';
import { Star } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { placeCategoryLabel } from '@/lib/utils/placeCategory';
import 'leaflet/dist/leaflet.css';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// side effect: L.maplibreGL()을 등록한다. 타입도 이 패키지가 leaflet 모듈에 덧붙인다.
import '@maplibre/maplibre-gl-leaflet';

/* 번들러를 거치면 maplibre가 import.meta.url 옆에서 워커를 못 찾아 베이스맵만 백지가 된다.
 * 파일은 predev/prebuild가 public/으로 복사한다(scripts/copy-maplibre-worker.mjs). */
setWorkerUrl('/maplibre-gl-worker.mjs');
import type { ItineraryStep } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { displayName, originalName, originalNameLang } from '@/lib/utils/placeName';
import { getDayColor } from '@/lib/constants/dayColors';
import ImageCredit from '@/components/common/ImageCredit';

/**
 * cartocdn은 키 없이 200 + 워터마크 타일을 돌려줘 성공처럼 보이고 지도는 비므로 키·한도가 없는 OpenFreeMap을 쓴다.
 * 어트리뷰션은 OpenFreeMap·OpenMapTiles·OSM 모두 표기를 요구해 지우면 약관 위반이다.
 */
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';
const VECTOR_ATTRIBUTION =
  '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> · ' +
  '&copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> · ' +
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** WebGL이 없는 환경(구형 브라우저·GPU 차단)용 래스터 폴백. 다크 변형은 없다. */
const RASTER_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const RASTER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TILE_MAX_ZOOM = 19;

/** maplibre는 WebGL을 요구한다. 없으면 캔버스가 조용히 비므로 미리 가른다. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** maplibre `setStyle`은 스타일 로드가 비동기라 전환 중 한 프레임이 비므로 테마가 바뀌면 레이어째 갈아끼운다. */
function VectorBasemap({ isDark }: { isDark: boolean }) {
  const map = useMap();

  useEffect(() => {
    // 브릿지는 이 값을 Leaflet 어트리뷰션 컨트롤에 넘긴다. 표기 의무가 걸린 문자열을
    // 외부 스타일 파일의 attribution에 맡기지 않는다.
    const layer = L.maplibreGL({
      style: isDark ? STYLE_DARK : STYLE_LIGHT,
      attributionControl: { customAttribution: VECTOR_ATTRIBUTION },
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, isDark]);

  return null;
}

/**
 * 모바일 폭에서 "Leaflet |" 접두어까지 붙으면 표기가 두 줄로 넘친다. Leaflet(BSD)은 지도 위 표기 의무가 없어 접두어만 뺀다.
 */
function AttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);
  return null;
}

/** `className`을 주면 Leaflet 기본 `leaflet-div-icon`(흰 사각형 + 그림자)을 대체하므로 리셋 CSS가 필요 없다. */
function stepIcon(fill: string, stroke: string, label: string, selected: boolean): L.DivIcon {
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: 'shg-step-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html:
      `<div style="width:${size}px;height:${size}px;border-radius:9999px;` +
      `background:${fill};border:2px solid ${stroke};box-sizing:border-box;` +
      `display:flex;align-items:center;justify-content:center;` +
      `color:#fff;font-size:${selected ? 13 : 12}px;font-weight:700;` +
      `line-height:1;font-variant-numeric:tabular-nums;">${label}</div>`,
  });
}

function arrowIcon(fill: string, stroke: string, angle: number): L.DivIcon {
  return L.divIcon({
    className: 'shg-route-arrow',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html:
      `<svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${angle.toFixed(1)}deg)">` +
      `<path d="M8 1.5 L13.2 13.5 L8 10.6 L2.8 13.5 Z" fill="${fill}" stroke="${stroke}" ` +
      `stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  });
}

type LatLngTuple = [number, number];

/**
 * 경로 길이 절반 지점과 그 지점의 진행 방향(화면 기준, 위쪽 0°·시계방향).
 * 하루 동선 규모(수십 km)에서는 cos 보정만으로 측지선 계산과 눈에 보이는 차이가 없다.
 */
function pathMidpoint(path: LatLngTuple[]): { pos: LatLngTuple; angle: number } | null {
  if (path.length < 2) return null;
  const cos = Math.cos((path[0][0] * Math.PI) / 180) || 1;

  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot((path[i][1] - path[i - 1][1]) * cos, path[i][0] - path[i - 1][0]);
    seg.push(d);
    total += d;
  }
  if (total === 0) return null;

  const half = total / 2;
  let acc = 0;
  for (let i = 0; i < seg.length; i++) {
    if (acc + seg[i] >= half) {
      const t = seg[i] === 0 ? 0 : (half - acc) / seg[i];
      const [lat1, lng1] = path[i];
      const [lat2, lng2] = path[i + 1];
      // 화면 y축은 위도와 반대 방향이므로, 북쪽(위도 증가)이 화면 위쪽 0°다.
      const angle = (Math.atan2((lng2 - lng1) * cos, lat2 - lat1) * 180) / Math.PI;
      return { pos: [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t], angle };
    }
    acc += seg[i];
  }
  return null;
}

function StepMarker({
  lat, lng, label, name, fill, stroke, selected, onClick,
}: {
  lat: number; lng: number; label: string; name: string; fill: string; stroke: string; selected: boolean;
  onClick: () => void;
}) {
  const icon = useMemo(() => stepIcon(fill, stroke, label, selected), [fill, stroke, label, selected]);
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      title={`${label}번 ${name}`}
      eventHandlers={{ click: onClick }}
    />
  );
}

function DayPolylines({ steps, isDark }: { steps: ItineraryStep[]; isDark: boolean }) {
  const paths = useMemo(() => {
    const byDay = new Map<number, ItineraryStep[]>();
    for (const step of steps) {
      if (!step.place) continue;
      const list = byDay.get(step.dayNumber) ?? [];
      list.push(step);
      byDay.set(step.dayNumber, list);
    }
    return Array.from(byDay.entries())
      .map(([dayNumber, daySteps]) => ({
        dayNumber,
        path: [...daySteps]
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((s): LatLngTuple => [s.place!.latitude, s.place!.longitude]),
      }))
      .filter((d) => d.path.length >= 2);
  }, [steps]);

  return (
    <>
      {paths.map(({ dayNumber, path }) => {
        const color = getDayColor(dayNumber, isDark);
        const mid = pathMidpoint(path);
        return (
          <Fragment key={dayNumber}>
            <Polyline
              positions={path}
              pathOptions={{ color: color.line, opacity: 0.7, weight: 3 }}
              interactive={false}
            />
            {mid && (
              <Marker
                position={mid.pos}
                icon={arrowIcon(color.line, isDark ? '#171a20' : '#ffffff', mid.angle)}
                interactive={false}
                keyboard={false}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

function MapController({
  steps,
  selectedStepId,
}: {
  steps: ItineraryStep[];
  selectedStepId: number | null;
}) {
  const map = useMap();

  // center+zoom 고정이면 첫 스텝 주변만 보이고 멀리 간 핀이 화면 밖에 남는다.
  const fitKey = steps.map((s) => s.id).join(',');
  useEffect(() => {
    const pts = steps
      .filter((s) => s.place)
      .map((s): LatLngTuple => [s.place!.latitude, s.place!.longitude]);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [56, 56] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);

  /* 선택이 실제로 바뀔 때만 돈다. steps를 deps에 넣으면 Day 전환 때 남은 selectedStepId가
   * 위 fitBounds를 덮어쓰므로 steps는 ref로 읽는다. */
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  useEffect(() => {
    if (selectedStepId == null) return;
    const step = stepsRef.current.find((s) => s.id === selectedStepId);
    if (step?.place) {
      map.setView([step.place.latitude, step.place.longitude], 15);
    }
  }, [map, selectedStepId]);

  return null;
}

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
  // ssr:false로만 마운트되므로 초기화 시점에 document가 있다. 한 번만 재고 유지한다.
  const [webgl] = useState(hasWebGL);
  const dayStepIndex = useDayStepIndex(steps);

  const firstPlace = steps[0]?.place;
  const center: LatLngTuple = firstPlace
    ? [firstPlace.latitude, firstPlace.longitude]
    : [37.5665, 126.978];

  const handleMarkerClick = useCallback(
    (stepId: number) => {
      onMarkerClick(stepId);
      setInfoStepId((prev) => (prev === stepId ? null : stepId));
    },
    [onMarkerClick],
  );

  const uniqueDays = useMemo(() => {
    const days = new Set(steps.map((s) => s.dayNumber));
    return Array.from(days).sort((a, b) => a - b);
  }, [steps]);

  const infoStep = infoStepId != null ? steps.find((s) => s.id === infoStepId) : undefined;

  return (
    <div className="relative w-full h-full">
      {/* Leaflet 자체 크롬은 라이트 고정이라 다크에서 흰 사각형으로 튄다.
          이 지도만의 문제라 globals.css가 아니라 소비자 옆에서 테마 토큰으로 덮는다. */}
      <style>{`
        /* isolation: Leaflet 내부 pane은 z-index 400~800을 쓴다. 스태킹 컨텍스트를 만들지
           않으면 그 숫자가 바깥 범례·헤더와 직접 경쟁한다. */
        .leaflet-container { background: var(--surface-2); font: inherit; isolation: isolate; }
        .leaflet-container a { color: var(--muted); }
        /* 표기 의무 문구라 잘라 숨기지 않고 한 줄 가로 스크롤로 둔다. 폭 기준을 지도로 잡으려고
           오른쪽 아래 컨트롤 칸을 지도 폭만큼 펼친다(이 칸은 pointer-events: none이라 지도 조작을 막지 않는다). */
        .leaflet-bottom.leaflet-right { left: 0; }
        .leaflet-control-attribution {
          background: color-mix(in srgb, var(--card-bg) 82%, transparent);
          color: var(--muted-2);
          font-size: 10px;
          white-space: nowrap;
          max-width: calc(100% - 8px);
          overflow-x: auto;
          scrollbar-width: thin;
        }
        .leaflet-bar, .leaflet-bar a {
          background: var(--card-bg);
          color: var(--text-2);
          border-color: var(--card-border);
        }
        .leaflet-bar a:hover { background: var(--surface-hover); color: var(--foreground); }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: var(--card-bg);
          color: var(--foreground);
          box-shadow: 0 4px 16px rgb(0 0 0 / 0.18);
        }
        .leaflet-popup-content-wrapper { border-radius: 10px; }
        .leaflet-popup-content { margin: 10px 12px; }
        .leaflet-popup-close-button { color: var(--muted-2) !important; }
      `}</style>

      <MapContainer
        center={center}
        zoom={13}
        maxZoom={TILE_MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        {webgl ? (
          <VectorBasemap isDark={isDark} />
        ) : (
          <TileLayer url={RASTER_FALLBACK} attribution={RASTER_ATTRIBUTION} maxZoom={TILE_MAX_ZOOM} />
        )}

        <AttributionPrefix />
        <MapController steps={steps} selectedStepId={selectedStepId} />
        <DayPolylines steps={steps} isDark={isDark} />

        {steps.map((step) => {
          if (!step.place) return null;
          const isSelected = step.id === selectedStepId;
          const color = getDayColor(step.dayNumber, isDark);
          const indexInDay = dayStepIndex.get(step.id) ?? 0;

          return (
            <StepMarker
              // title은 Leaflet이 생성 때만 읽어 번호·장소가 바뀌면 다시 만들어야 한다.
              key={`${step.id}-${indexInDay}-${displayName(step.place)}`}
              lat={step.place.latitude}
              lng={step.place.longitude}
              label={String(indexInDay)}
              name={displayName(step.place)}
              fill={color.bg}
              stroke={isSelected ? '#ffffff' : color.border}
              selected={isSelected}
              onClick={() => handleMarkerClick(step.id)}
            />
          );
        })}

        {/* 같은 마커 재클릭이 토글로 동작하려면 열림 상태를 우리가 들고 있어야 해서 독립 Popup을 쓴다.
            `remove`는 ×·배경클릭과 언마운트 모두에서 불리므로 prev를 비교해 다른 스톱으로 옮긴 경우를 거른다. */}
        {infoStep?.place && (
          <Popup
            position={[infoStep.place.latitude, infoStep.place.longitude]}
            offset={[0, -16]}
            eventHandlers={{
              remove: () => setInfoStepId((prev) => (prev === infoStep.id ? null : prev)),
            }}
          >
            {(() => {
              const place = infoStep.place!;
              const original = originalName(place);
              const color = getDayColor(infoStep.dayNumber, isDark);
              return (
                <div className="text-sm min-w-[180px] max-w-[220px]">
                  {place.imageUrl && (
                    <div className="relative w-full h-24 rounded-lg mb-2 overflow-hidden bg-surface-3">
                      <img
                        src={proxyImageUrl(place.imageUrl)!}
                        alt={displayName(place)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <ImageCredit
                        credit={place.imageCredit}
                        license={place.imageLicense}
                        sourceUrl={place.imageSourceUrl}
                        className="bottom-1.5 right-1.5"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: color.bg }}
                    />
                    <span className="text-xs text-muted-2">{infoStep.dayNumber}일차</span>
                  </div>
                  <p className="font-semibold text-foreground">{displayName(place)}</p>
                  {original && (
                    <p lang={originalNameLang(place)} className="text-xs text-muted-2">{original}</p>
                  )}
                  <p className="text-muted text-xs mt-0.5">{place.address}</p>
                  {placeCategoryLabel(place.category) && (
                    <p style={{ color: color.bg }} className="text-xs mt-0.5">
                      {placeCategoryLabel(place.category)}
                    </p>
                  )}
                  {/* 별점은 데이터라 amber(경고 계열)나 상태색을 쓰지 않는다 */}
                  {place.rating != null && (
                    <div className="flex items-center gap-1 text-xs mt-0.5 text-text-2">
                      <Star size={12} className="fill-current" aria-hidden="true" />
                      <span>{place.rating}</span>
                    </div>
                  )}
                  {infoStep.startTime && infoStep.endTime && (
                    <p className="text-muted-2 text-xs mt-0.5 tabular-nums">
                      {infoStep.startTime} - {infoStep.endTime}
                    </p>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}
      </MapContainer>

      {uniqueDays.length > 1 && (
        <div className="absolute top-3 left-3 bg-card-bg/90 backdrop-blur-sm rounded-[10px] shadow-md border border-card-border px-3 py-2 flex flex-col gap-1 z-10">
          {uniqueDays.map((day) => {
            const color = getDayColor(day, isDark);
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
  );
}
