/**
 * 목적지 커버 그라데이션 유틸.
 *
 * 리디자인 핸드오프의 "동일 사진 반복 문제" 해결책 — 목적지별 hue(H)로
 * oklch 그라데이션을 코드 생성한다. 별도 이미지 에셋 불필요.
 *
 *   Light: linear-gradient(140deg, oklch(0.80 0.028 H) 0%, oklch(0.66 0.042 H+18) 100%)
 *   Dark:  linear-gradient(140deg, oklch(0.44 0.035 H) 0%, oklch(0.30 0.05 H+18) 100%)
 *
 * 2026-09-10: 잉크+샤르트뢰즈 팔레트로 교체하면서 chroma를 0.11~0.15 → 0.028~0.05로
 * 낮췄다. 커버는 폴백이므로 accent·타이포보다 앞에 나서면 안 된다.
 *
 * 2026-09-10(2차): hue를 색상환 전역(0~360)에서 뽑던 것을 **60~210 한 대역**으로 묶었다.
 * 로그인 콜라주에 네 타일이 나란히 놓이자 초록·파랑·갈색·보라 무지개가 됐고, 그 중 보라(285)는
 * AI tell 1순위였다. 100~210(초록 → 청록 → 짙은 파랑)은 유사색 대역이라, 몇 개를 나란히 놓아도
 * 한 벌로 읽히면서 목적지 구분은 유지된다.
 * 하한을 60 → 78 → 100으로 두 번 올렸다. 60에서는 hue 70이 갈색, 78에서는 88이 카키로 떨어져
 * 넷 중 하나가 늘 혼자 탁했다. 100부터는 노란 구간이 아예 없다.
 * 따뜻한 색은 이 폴백이 아니라 accent(올리브)가 담당한다 — 폴백이 브랜드보다 먼저 눈에 띌 이유가 없다.
 * 이 대역 밖(보라·마젠타·빨강·주황·갈색·카키)은 쓰지 않는다.
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
 * @param rich 큰 타일용 고채도. 콜라주처럼 여럿이 나란히 놓일 때 저채도는 물빠져 보인다.
 */
export function coverGradient(
  destination: string,
  variant: 'light' | 'dark' = 'light',
  seedOffset = 0,
  rich = false,
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
  // 이 그라데이션은 사진이 없을 때의 *폴백*이다. 폴백이 화면에서 가장 시끄러운
  // 요소가 되면 안 되므로 chroma를 크게 낮춰 무채색에 가깝게 두고, 목적지별
  // hue는 식별 가능한 정도로만 남긴다. 컬러는 실사진과 accent가 담당한다.
  // 큰 타일(랜딩/로그인 콜라주)은 여럿이 나란히 놓여 저채도면 물빠져 보인다.
  // 작은 카드 커버(대시보드)는 사진·텍스트를 방해하지 않게 낮은 채도를 유지한다.
  // rich도 "물빠짐 방지"까지만 올린다. 0.09~0.12까지 올렸더니 큰 타일이 물감 색표본처럼 보였다.
  const c1 = rich ? 0.045 : 0.028;
  const c2 = rich ? 0.062 : 0.042;
  if (variant === 'dark') {
    return `linear-gradient(140deg, oklch(0.42 ${rich ? 0.05 : 0.035} ${h}) 0%, oklch(0.28 ${rich ? 0.068 : 0.05} ${h2}) 100%)`;
  }
  return `linear-gradient(140deg, oklch(0.80 ${c1} ${h}) 0%, oklch(0.66 ${c2} ${h2}) 100%)`;
}
