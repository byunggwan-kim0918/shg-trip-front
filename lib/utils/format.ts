/**
 * 양의 정수를 천 단위 콤마 포맷 문자열로 변환
 * @example formatBudget(1500000) => "1,500,000"
 */
export function formatBudget(value: number): string {
  return Math.floor(value).toLocaleString('ko-KR');
}

/**
 * 콤마 포맷 문자열을 숫자로 파싱
 * @example parseBudget("1,500,000") => 1500000
 */
export function parseBudget(formatted: string): number {
  return Number(formatted.replace(/,/g, '')) || 0;
}

/**
 * 분 단위 이동시간을 사람이 읽기 쉬운 "X시간 Y분" 형태로 변환.
 * 60분 미만은 "N분", 정시는 "N시간"으로 표기.
 * @example formatDuration(679) => "11시간 19분"
 * @example formatDuration(40) => "40분"
 * @example formatDuration(120) => "2시간"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/**
 * 한 여행지 내 하루 이동으로 비현실적인 구간거리(km) 임계값.
 * 초과 시 불량 좌표로 만들어진 이동으로 보고 UI에서 경고를 표시한다.
 * (백엔드 RouteOptimizer.MAX_REASONABLE_LEG_KM와 동일 개념)
 */
export const UNREALISTIC_LEG_KM = 150;
