export function formatBudget(value: number): string {
  return Math.floor(value).toLocaleString('ko-KR');
}

export function parseBudget(formatted: string): number {
  return Number(formatted.replace(/,/g, '')) || 0;
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
