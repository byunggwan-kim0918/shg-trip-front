'use client';

import { useEffect, useCallback, useState, useMemo, useRef, Fragment } from 'react';
import { Star } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// side effect: L.maplibreGL()을 등록한다. 타입도 이 패키지가 leaflet 모듈에 덧붙인다.
import '@maplibre/maplibre-gl-leaflet';

/* 워커 경로를 명시한다. maplibre는 기본적으로 `import.meta.url` 옆에서 워커를 찾는데,
 * 번들러를 거치면 그 자리가 청크 디렉터리라 파일이 없다. 그러면 콘솔 에러 하나만 남고
 * 마커·경로선은 멀쩡한 채 **베이스맵만 백지**가 된다(타일 디코딩이 전부 워커에서 돈다).
 * 파일은 predev/prebuild가 public/으로 복사한다 — scripts/copy-maplibre-worker.mjs */
setWorkerUrl('/maplibre-gl-worker.mjs');
import type { ItineraryStep } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

/** 일차별 색상 램프 (최대 10일).
 *
 * 일차는 **범주가 아니라 순서**(Day 1 → N)다. 예전 팔레트는 색상환을 고르게 분배한
 * 범주형이라 4일차 보라(#643e98)·9일차 마젠타(#983e98)·3일차 갈색(#98643e)이 나왔고,
 * 상세 화면의 40%를 차지하는 지도 위에서 그게 곧 무지개였다(보라는 AI tell 1순위이기도 하다).
 * 순서형 데이터에는 순서형 스케일을 쓴다 — 브랜드 올리브(70°)에서 출발해 초록 → 청록 → 파랑으로
 * 한 방향으로만 흐른다. 색상환을 한 바퀴 돌지 않으므로 따뜻한 색(갈색·보라·마젠타)이 아예 없다.
 *
 * bg=마커 채움(흰 숫자 대비 4.5 이상) / border=한 단계 어둡게 / line=경로선 한 단계 밝게.
 *
 * 다크 변형은 **테두리와 경로선만** 밝힌다(borderDark/lineDark). 채움(bg)은 양 테마 공통이다 —
 * 마커 라벨이 흰색 하드코딩이라 채움을 밝히면 흰 숫자의 대비가 4.5 아래로 떨어진다
 * (예: #5f6a1e는 흰 글자 5.90인데 한 단계 밝은 #7a8729는 3.94). 다크 타일(#171a20) 위에서
 * 묻히는 건 어두운 테두리이므로, 분리는 테두리를 밝혀서 얻는다.
 */
const DAY_COLORS = [
  { bg: '#5f6a1e', border: '#49521a', line: '#7a8729', borderDark: '#9cab36', lineDark: '#9cab36' }, //  1일차  70° 올리브 = 브랜드
  { bg: '#3d6b32', border: '#2e5226', line: '#4e8640', borderDark: '#64a855', lineDark: '#64a855' }, //  2일차 125° 초록
  { bg: '#1f6457', border: '#174c43', line: '#2a8273', borderDark: '#37a492', lineDark: '#37a492' }, //  3일차 165° 청록
  { bg: '#255d7e', border: '#1b4660', line: '#2f77a1', borderDark: '#4196c7', lineDark: '#4196c7' }, //  4일차 200° 바다
  { bg: '#3a4a86', border: '#2b3765', line: '#4b5fa8', borderDark: '#6c7fc8', lineDark: '#6c7fc8' }, //  5일차 228° 남색
  { bg: '#6b7335', border: '#535a29', line: '#879148', borderDark: '#a6b25c', lineDark: '#a6b25c' }, //  6일차  70° (밝은 변주)
  { bg: '#4c7742', border: '#3a5c33', line: '#64925a', borderDark: '#7fb473', lineDark: '#7fb473' }, //  7일차 125°
  { bg: '#357a6c', border: '#285d52', line: '#449587', borderDark: '#57b5a5', lineDark: '#57b5a5' }, //  8일차 165°
  { bg: '#3c7496', border: '#2d5872', line: '#4d8fb5', borderDark: '#68aed6', lineDark: '#68aed6' }, //  9일차 200°
  { bg: '#51619b', border: '#3d4a77', line: '#6878b5', borderDark: '#8696d2', lineDark: '#8696d2' }, // 10일차 228°
];

/**
 * 베이스맵. Google Maps JS를 걷어내고 OpenFreeMap 벡터 타일로 옮겼다 — **키도 한도도 없다**
 * (openfreemap.org가 명시한 조건이다).
 *
 * CARTO Positron/Dark Matter를 먼저 붙였다가 되돌렸다. `basemaps.cartocdn.com`은 이제
 * 좌표와 무관하게 "API KEY REQUIRED" 워터마크 타일(2,049B, 모든 타일이 같은 MD5)을 200으로
 * 돌려준다. HTTP 200에 image/png라 코드에서는 성공으로 보이지만 지도는 빈 회색이다.
 * Stadia도 401(키 필요), Esri Canvas는 키 없이 열리지만 라벨 레이어가 분리돼 있고 약관이
 * ArcGIS 계정을 전제한다. 이번 작업의 목적이 "키를 지워도 도는 상태"이므로 전부 탈락이다.
 *
 * Google `styles` 배열로 하던 POI 끄기·채도 낮추기는 **처음부터 그렇게 디자인된 스타일**로
 * 대체한다 — positron/dark는 상업 POI 핀이 없고 채도가 낮아 우리 번호 마커와 경쟁하지 않고,
 * 다크도 CSS invert 해킹(물이 갈색이 되던 그것) 없이 진짜 다크다. 벡터라 레티나에서도 선명하다.
 *
 * 어트리뷰션은 OpenFreeMap·OpenMapTiles·OSM 모두 표기를 요구한다. 지우면 약관 위반이다.
 */
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';
const VECTOR_ATTRIBUTION =
  '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> · ' +
  '&copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> · ' +
  'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

/** OpenFreeMap 벡터 스타일을 Leaflet 레이어로 얹는다.
 *
 * 테마가 바뀌면 레이어째 갈아끼운다. maplibre의 `setStyle`로 바꿀 수도 있지만, 그러면
 * 스타일 로드가 비동기라 전환 중 한 프레임이 빈 캔버스로 남는다.
 */
function VectorBasemap({ isDark }: { isDark: boolean }) {
  const map = useMap();

  useEffect(() => {
    // 브릿지는 maplibre 자체 컨트롤을 끄고(attributionControl:false로 덮어씀) 이 값을
    // Leaflet 어트리뷰션 컨트롤에 넘긴다. 스타일 source의 attribution을 자동으로 읽기도 하지만,
    // 표기 의무가 걸린 문자열을 외부 스타일 파일에 맡기지 않는다.
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

/** 일차 색 + 테마. 다크에서는 테두리·경로선만 밝은 변형으로 바꾼다(채움은 공통). */
function getDayColor(dayNumber: number, isDark = false) {
  const c = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  return isDark
    ? { bg: c.bg, border: c.borderDark, line: c.lineDark }
    : { bg: c.bg, border: c.border, line: c.line };
}

/** 번호가 박힌 원형 마커.
 *
 * `className`을 주면 Leaflet 기본값 `leaflet-div-icon`(흰 사각형 + 그림자)을 **대체**하므로
 * 별도 리셋 CSS가 필요 없다. Google legacy Marker 시절에는 SVG를 data URI로 만들어
 * `label` 옵션으로 숫자를 얹었는데, divIcon에서는 그냥 HTML이면 된다.
 */
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

/** 경로 중간의 진행 방향 화살표. Google `SymbolPath.FORWARD_CLOSED_ARROW` + `offset:'50%'` 대응. */
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

/** 경로 전체 길이의 절반 지점과 그 지점의 진행 방향(화면 기준, 위쪽 0°·시계방향).
 *
 * 경도 1도는 위도에 따라 짧아지므로 cos 보정만 넣는다. 하루 동선 규모(수십 km)에서는
 * 측지선 계산과 눈에 보이는 차이가 없다.
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

/** 번호 마커 하나. */
function StepMarker({
  lat, lng, label, fill, stroke, selected, onClick,
}: {
  lat: number; lng: number; label: string; fill: string; stroke: string; selected: boolean; onClick: () => void;
}) {
  const icon = useMemo(() => stepIcon(fill, stroke, label, selected), [fill, stroke, label, selected]);
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: onClick }}
    />
  );
}

/** 일차별 step 순서대로 경로선과 방향 화살표를 그린다. */
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

/** 선택된 step으로 pan하는 컨트롤러 */
function MapController({
  steps,
  selectedStepId,
}: {
  steps: ItineraryStep[];
  selectedStepId: number | null;
}) {
  const map = useMap();

  // 표시 중인 스텝 전체가 들어오도록 맞춘다. 예전엔 center+zoom(13) 고정이라
  // 첫 스텝 주변만 보이고 나머지 핀이 화면 밖에 있었다(제주 공항 → 성산처럼 멀리 가는 날은 대부분).
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

  /* 선택된 스톱으로 pan — **선택이 실제로 바뀔 때만** 돈다.
   *
   * 예전엔 deps에 steps가 있었다. 그러면 Day를 전환할 때도(steps가 새 배열) 이 효과가 다시 돌고,
   * 이전에 클릭해 둔 selectedStepId가 남아 있으면 setView(.., 15)로 **위 fitBounds를 덮어썼다**.
   * 그래서 Day를 바꿔도 핀 전체가 들어오지 않고 한 핀만 확대된 채 나머지가 화면 가장자리로 몰렸다.
   * steps는 ref로 읽어 최신 값을 쓰면서 재실행 트리거에서는 뺀다. */
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

  // 고유 일차 목록 (범례용)
  const uniqueDays = useMemo(() => {
    const days = new Set(steps.map((s) => s.dayNumber));
    return Array.from(days).sort((a, b) => a - b);
  }, [steps]);

  const infoStep = infoStepId != null ? steps.find((s) => s.id === infoStepId) : undefined;

  return (
    <div className="relative w-full h-full">
      {/* Leaflet 자체 크롬(타일 배경·줌 버튼·어트리뷰션·말풍선)은 라이트 고정이라
          다크에서 흰 사각형으로 튄다. 테마 토큰으로 덮는다 — 이 지도만의 문제라
          globals.css가 아니라 소비자 옆에 둔다. */}
      <style>{`
        /* isolation: Leaflet 내부 pane은 z-index 400~800을 쓴다. 스태킹 컨텍스트를 만들지
           않으면 그 숫자가 바깥 범례·헤더와 직접 경쟁한다. */
        .leaflet-container { background: var(--surface-2); font: inherit; isolation: isolate; }
        .leaflet-container a { color: var(--muted); }
        .leaflet-control-attribution {
          background: color-mix(in srgb, var(--card-bg) 82%, transparent);
          color: var(--muted-2);
          font-size: 10px;
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

        <MapController steps={steps} selectedStepId={selectedStepId} />
        <DayPolylines steps={steps} isDark={isDark} />

        {steps.map((step) => {
          if (!step.place) return null;
          const isSelected = step.id === selectedStepId;
          const color = getDayColor(step.dayNumber, isDark);
          const indexInDay = dayStepIndex.get(step.id) ?? 0;

          return (
            <StepMarker
              key={step.id}
              lat={step.place.latitude}
              lng={step.place.longitude}
              label={String(indexInDay)}
              fill={color.bg}
              stroke={isSelected ? '#ffffff' : color.border}
              selected={isSelected}
              onClick={() => handleMarkerClick(step.id)}
            />
          );
        })}

        {/* 말풍선은 Marker 자식이 아니라 좌표를 직접 받는 독립 Popup이다 — 열림 상태를
            Leaflet이 아니라 우리가 들고 있어야 같은 마커 재클릭이 토글로 동작한다.
            `remove`는 ×·배경클릭에서도 React 언마운트에서도 불리므로, prev를 비교해
            "다른 스톱으로 막 옮긴 경우"를 걸러낸다. */}
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
              const color = getDayColor(infoStep.dayNumber, isDark);
              return (
                <div className="text-sm min-w-[180px] max-w-[220px]">
                  {place.imageUrl && (
                    <div className="w-full h-24 rounded-lg mb-2 overflow-hidden bg-surface-3">
                      <img
                        src={proxyImageUrl(place.imageUrl)!}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
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
                  <p className="font-semibold text-foreground">{place.name}</p>
                  <p className="text-muted text-xs mt-0.5">{place.address}</p>
                  <p style={{ color: color.bg }} className="text-xs mt-0.5">
                    {place.category}
                  </p>
                  {/* 별점은 데이터다. amber(경고 계열)나 상태색을 쓰지 않는다 */}
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

      {/* 일차별 범례 */}
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
