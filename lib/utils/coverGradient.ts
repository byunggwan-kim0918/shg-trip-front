/**
 * 목적지 커버 폴백 유틸.
 *
 * 2026-10-02 전면 재설계 — **색면을 그리던 것을 종이로 바꿨다.**
 *
 * 이전 설계는 Airbnb·hedwig류의 "사진이 컬러를 담당한다" 자세를 빌려왔는데,
 * 이 제품에는 **사진이 한 장도 없다.** 그 결과가 "사진 없는 사진 주도 디자인" —
 * 대시보드 카드 5장의 커버 밴드가 전부 같은 세이지그린이라 제주·부산·도쿄·강릉·여수가
 * 구분되지 않았고, 랜딩 우측 절반은 라벨 4개 말고는 정보가 0인 페인트 칩이었다.
 * 채도를 0.11 → 0.028까지 두 번 낮추고 hue 대역을 100~210으로 좁혔지만,
 * 방향 자체가 틀렸기 때문에 "덜 시끄러운 색표본"이 됐을 뿐이다.
 *
 * 번역을 다시 했다. 레퍼런스가 작동하는 이유는 *사진이 있어서* UI가 무채색으로
 * 물러날 수 있다는 것이다. 사진이 없으면 물러날 대상도 없다.
 * → **커버가 무채색 종이로 물러나고, 화면에 남는 유채색은 브랜드 하나뿐이다.**
 *   목적지 구분은 색이 아니라 **타이포와 위치**가 한다(카드 제목이 주역).
 *
 * chroma 0.028~0.062 → **0.006~0.013**. 색상(hue)은 "이 타일과 저 타일이 같지 않다"는
 * 정도로만 남고, 이름을 댈 수 있는 색이 되지 않는다.
 * 명도도 올렸다(0.80~0.66 → 0.945~0.90). 커버는 이제 카드 안의 **면**이지 블록이 아니다.
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
  // seedOffset·종점 shift 모두 대역 안에서만 움직인다. %360으로 감으면 보라로 새어나간다.
  // 단 대역 안에서 %로 감아도 안 된다 — 대역 끝(부산 210)에 오프셋이 붙으면 반대쪽 끝(올리브)으로
  // 튀어 파랑이어야 할 타일이 갈색이 된다. 경계에서 되돌아오도록 반사시킨다.
  const span = HUE_MAX - HUE_MIN;
  const reflect = (v: number) => {
    const period = span * 2;
    const m = ((v % period) + period) % period;
    return HUE_MIN + (m <= span ? m : period - m);
  };
  const h = reflect(hueForDestination(destination) - HUE_MIN + seedOffset);
  const h2 = reflect(h - HUE_MIN + 18);
  // 종이 톤. 사진이 없을 때의 폴백이고, 폴백이 브랜드보다 먼저 눈에 띌 이유가 없다.
  const c1 = 0.009;
  const c2 = 0.013;
  if (variant === 'dark') {
    return `linear-gradient(145deg, oklch(0.235 ${c1} ${h}) 0%, oklch(0.195 ${c2} ${h2}) 100%)`;
  }
  return `linear-gradient(145deg, oklch(0.945 ${c1} ${h}) 0%, oklch(0.902 ${c2} ${h2}) 100%)`;
}
