/**
 * 커버 사진이 없어 폴백은 무채색 종이로 물러나고, 목적지 구분은 색이 아니라 카드 제목이 맡는다.
 * chroma 0.006~0.013은 타일끼리 같지 않다는 정도만 남고 이름을 댈 수 있는 색이 되지 않는 범위다.
 */

/** 대역 경계. 이 밖의 hue는 만들지 않는다. */
const HUE_MIN = 100;
const HUE_MAX = 210;

/** 주요 목적지 고정 hue. 전부 HUE_MIN~HUE_MAX 안. 부분 일치로 매칭. */
const DESTINATION_HUE: Array<{ match: string; hue: number }> = [
  { match: '제주', hue: 175 },
  { match: '인천', hue: 198 },
  { match: '부산', hue: 210 },
  { match: '서울', hue: 128 },
  { match: '경주', hue: 110 },
  { match: '강릉', hue: 192 },
  { match: '여수', hue: 185 },
  { match: '전주', hue: 115 },
  { match: '속초', hue: 203 },
  { match: '도쿄', hue: 145 },
  { match: '오사카', hue: 120 },
  { match: '후쿠오카', hue: 160 },
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
  return HUE_MIN + (Math.abs(hash) % (HUE_MAX - HUE_MIN));
}

/**
 * @param variant 미지정 시 light를 반환한다(다크는 컴포넌트가 CSS 변수/클래스로 처리).
 * @param seedOffset 같은 목적지 카드들을 미세하게 구분하는 hue 오프셋.
 */
export function coverGradient(
  destination: string,
  variant: 'light' | 'dark' = 'light',
  seedOffset = 0,
): string {
  // %360으로 감으면 보라로 새고, 대역 안에서 %로 감아도 끝(부산 210)에서 반대쪽 올리브로 튀므로
  // 오프셋은 대역 경계에서 반사시킨다.
  const span = HUE_MAX - HUE_MIN;
  const reflect = (v: number) => {
    const period = span * 2;
    const m = ((v % period) + period) % period;
    return HUE_MIN + (m <= span ? m : period - m);
  };
  const h = reflect(hueForDestination(destination) - HUE_MIN + seedOffset);
  const h2 = reflect(h - HUE_MIN + 18);
  // 사진이 없을 때의 폴백이 브랜드보다 먼저 눈에 띄지 않게 종이 톤으로 둔다.
  const c1 = 0.009;
  const c2 = 0.013;
  if (variant === 'dark') {
    return `linear-gradient(145deg, oklch(0.235 ${c1} ${h}) 0%, oklch(0.195 ${c2} ${h2}) 100%)`;
  }
  return `linear-gradient(145deg, oklch(0.945 ${c1} ${h}) 0%, oklch(0.902 ${c2} ${h2}) 100%)`;
}
