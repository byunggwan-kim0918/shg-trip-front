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

/** 하루 안 구간(도로 km)이 이보다 길면 좌표가 틀렸을 가능성이 커 경고한다. 백엔드가 이동을 비우는 직선 200km보다 낮게 잡는다. */
export const UNREALISTIC_LEG_KM = 150;

/** 열차·비행기·차로 도시를 옮기는 구간은 수백 km가 정상이다. */
export function isIntercityMode(mode: TransportType | null | undefined): boolean {
  return mode === 'TRAIN' || mode === 'FLIGHT' || mode === 'DRIVE';
}

export function isUnrealisticLeg(mode: TransportType | null | undefined, distanceKm: number | null | undefined): boolean {
  return distanceKm != null && distanceKm > UNREALISTIC_LEG_KM && !isIntercityMode(mode);
}
