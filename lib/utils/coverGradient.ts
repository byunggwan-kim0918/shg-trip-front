/**
 * 목적지 커버 그라데이션 유틸.
 *
 * 리디자인 핸드오프의 "동일 사진 반복 문제" 해결책 — 목적지별 hue(H)로
 * oklch 그라데이션을 코드 생성한다. 별도 이미지 에셋 불필요.
 *
 *   Light: linear-gradient(140deg, oklch(0.74 0.11 H) 0%, oklch(0.52 0.15 H+18) 100%)
 *   Dark:  linear-gradient(140deg, oklch(0.60 0.11 H) 0%, oklch(0.42 0.14 H+18) 100%)
 *
 * H(hue)는 목적지 문자열 해시로 결정하되, 주요 목적지는 사전값으로 고정해
 * 브랜드 일관성을 유지한다(제주 계열 148~186, 인천 245 등).
 */

/** 주요 목적지 고정 hue (핸드오프 예시값). 부분 일치로 매칭. */
const DESTINATION_HUE: Array<{ match: string; hue: number }> = [
  { match: '제주', hue: 165 },
  { match: '인천', hue: 245 },
  { match: '부산', hue: 210 },
  { match: '서울', hue: 265 },
  { match: '경주', hue: 45 },
  { match: '강릉', hue: 200 },
  { match: '여수', hue: 190 },
  { match: '전주', hue: 30 },
  { match: '속초', hue: 205 },
  { match: '도쿄', hue: 285 },
  { match: '오사카', hue: 340 },
  { match: '후쿠오카', hue: 15 },
];

/** 목적지 문자열 → hue(0~360). 사전 우선, 없으면 해시 기반. */
export function hueForDestination(destination: string): number {
  const dest = destination.trim();
  for (const { match, hue } of DESTINATION_HUE) {
    if (dest.includes(match)) return hue;
  }
  let hash = 0;
  for (let i = 0; i < dest.length; i++) {
    hash = dest.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/**
 * 목적지 → CSS 그라데이션 문자열.
 * @param variant 'light'|'dark'. 지정 시 해당 테마 그라데를 반환.
 *                미지정 시 light를 반환(다크는 컴포넌트에서 CSS 변수/클래스로 처리).
 * @param seedOffset 같은 목적지 카드들을 미세하게 구분하기 위한 hue 오프셋.
 */
export function coverGradient(
  destination: string,
  variant: 'light' | 'dark' = 'light',
  seedOffset = 0,
): string {
  const h = (hueForDestination(destination) + seedOffset) % 360;
  const h2 = (h + 18) % 360;
  if (variant === 'dark') {
    return `linear-gradient(140deg, oklch(0.60 0.11 ${h}) 0%, oklch(0.42 0.14 ${h2}) 100%)`;
  }
  return `linear-gradient(140deg, oklch(0.74 0.11 ${h}) 0%, oklch(0.52 0.15 ${h2}) 100%)`;
}
