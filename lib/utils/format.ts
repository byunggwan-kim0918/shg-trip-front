import type { TransportType } from '@/lib/types/itinerary';

export function formatBudget(value: number): string {
  return Math.floor(value).toLocaleString('ko-KR');
}

/** 60분 미만은 "N분", 정시는 "N시간", 그 외는 "X시간 Y분". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 초과 구간은 불량 좌표로 만들어진 이동으로 보고 경고한다(백엔드 RouteOptimizer.MAX_REASONABLE_LEG_KM와 같은 개념). */
export const UNREALISTIC_LEG_KM = 150;

/** 열차·비행기로 도시를 옮기는 구간은 수백 km가 정상이다. */
export function isIntercityMode(mode: TransportType | null | undefined): boolean {
  return mode === 'TRAIN' || mode === 'FLIGHT';
}

export function isUnrealisticLeg(mode: TransportType | null | undefined, distanceKm: number | null | undefined): boolean {
  return distanceKm != null && distanceKm > UNREALISTIC_LEG_KM && !isIntercityMode(mode);
}
