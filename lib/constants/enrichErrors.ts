/**
 * errorCode 문자열은 백엔드 enrich-input.txt와 1:1이다.
 * 마법사 단계: 0=여행지·기간 / 1=테마·카테고리 / 2=스타일 / 3=예산 / 4=확인
 */
export const ENRICH_ERROR_STEP: Record<string, number> = {
  UNREALISTIC_BUDGET: 3,
  CONFLICTING_THEMES: 1,
  INVALID_DESTINATION: 0,
  INVALID_DATE_RANGE: 0,
  // 백엔드가 errorCode 누락 시 쓰는 일반 코드라 단계를 알 수 없다.
  INVALID_INPUT: 0,
  // 장소 데이터 부족(PLANNING_005)은 같은 조건으로 재시도해도 같은 결과다.
  PLANNING_005: 0,
};

/** 해당 errorCode가 "사용자 입력 조건" 문제라 마법사 수정으로 해결 가능한지. */
export function isEnrichValidationError(code: string | null | undefined): boolean {
  return !!code && code in ENRICH_ERROR_STEP;
}

/** 미매핑·무코드는 0. */
export function enrichErrorStep(code: string | null | undefined): number {
  return code && code in ENRICH_ERROR_STEP ? ENRICH_ERROR_STEP[code] : 0;
}
