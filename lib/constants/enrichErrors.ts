/**
 * 백엔드 enrich(현실성 검증) 실패 errorCode → 마법사 수정 단계 매핑.
 * SSE error 이벤트의 errorCode를 받아 "조건 수정" 버튼이 해당 단계로 점프하게 한다.
 * (백엔드 enrich-input.txt의 errorCode 문자열과 1:1. 미매핑 코드는 step 0으로 폴백.)
 *
 * 마법사 단계: 0=여행지·기간 / 1=테마·카테고리 / 2=스타일 / 3=예산 / 4=확인
 */
export const ENRICH_ERROR_STEP: Record<string, number> = {
  UNREALISTIC_BUDGET: 3,   // 예산 단계
  CONFLICTING_THEMES: 1,   // 테마 단계
  INVALID_DESTINATION: 0,  // 여행지 단계
  INVALID_DATE_RANGE: 0,   // 기간(=여행지 단계에 함께)
  // 백엔드가 errorCode 누락 시 대체하는 일반 코드 — 특정 단계 불명이라 여행지 단계로.
  INVALID_INPUT: 0,
};

/** 해당 errorCode가 "사용자 입력 조건" 문제라 마법사 수정으로 해결 가능한지. */
export function isEnrichValidationError(code: string | null | undefined): boolean {
  return !!code && code in ENRICH_ERROR_STEP;
}

/** errorCode → 점프할 마법사 단계(미매핑/무코드는 0). */
export function enrichErrorStep(code: string | null | undefined): number {
  return code && code in ENRICH_ERROR_STEP ? ENRICH_ERROR_STEP[code] : 0;
}
