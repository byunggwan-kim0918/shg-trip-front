import type { TripChatSlot } from '@/lib/types/tripChat';

/**
 * 생성 중 오류 코드 → 확인 화면에서 강조할 항목. enrich 코드는 백엔드 enrich-input.txt와 1:1이고,
 * 나머지는 생성 중 SSE error 이벤트가 보내는 ErrorCode 값이다. null이면 확인 화면 맨 위로 연다.
 */
export const ENRICH_ERROR_FOCUS: Record<string, TripChatSlot | null> = {
  UNREALISTIC_BUDGET: 'EXTRAS',
  CONFLICTING_THEMES: 'MOOD',
  INVALID_DESTINATION: 'CITY',
  INVALID_DATE_RANGE: 'DATES',
  // enrich가 errorCode를 빠뜨렸을 때 쓰는 일반 코드라 항목을 알 수 없다.
  INVALID_INPUT: null,
  COMMON_001: null,
  // 장소 데이터 부족은 같은 조건으로 다시 만들어도 같은 결과다.
  PLANNING_005: 'CITY',
  PLACE_002: 'ANCHORS',
};

/** 해당 errorCode가 "사용자 입력 조건" 문제라 조건을 고쳐서 해결할 수 있는지. */
export function isEnrichValidationError(code: string | null | undefined): boolean {
  return !!code && code in ENRICH_ERROR_FOCUS;
}

export function enrichErrorFocus(code: string | null | undefined): TripChatSlot | null {
  return code && code in ENRICH_ERROR_FOCUS ? ENRICH_ERROR_FOCUS[code] : null;
}
