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
