/**
 * SHG trip 브랜드 마크 — 굽은 길 + 도착점.
 *
 * 앞서 쓰던 마크(경선 그려진 지구)는 브라우저 기본 아이콘처럼 생겨 브랜드가 없었고,
 * 상세형은 16px에서 내부 획이 뭉개져 크기별로 두 벌을 유지해야 했다.
 * 이 마크는 획 하나 + 원 하나라 16px에서도 형태가 그대로 남아 한 벌로 끝난다.
 *
 * 색은 테마를 따라가지 않는다. 브랜드 마크는 어디서나 같은 것으로 보여야 하고,
 * 파비콘·apple-icon·OG는 리터럴이라 애초에 테마를 따라갈 수 없다 —
 * 앱만 반전시키면 탭과 사이드바가 다른 로고로 보인다(실제로 그래서 지적받았다).
 * 다크 캔버스(#0d0e12)와 잉크 사각형(#1c1c1e)은 대비 1.13이라 그냥 두면 묻히므로
 * 실낱 링으로 가장자리만 분리한다. 링은 라이트에서는 사실상 보이지 않는다.
 */
interface Props {
  /** 바깥 정사각형 한 변 px. */
  size?: number;
  /** 모서리 반경 클래스. 아이콘 스케일 규약(28px 이하 `rounded-[10px]`, 그 이상 `rounded-2xl`). */
  radiusClassName?: string;
  className?: string;
}

export default function Logo({ size = 28, radiusClassName, className = '' }: Props) {
  const radius = radiusClassName ?? (size <= 28 ? 'rounded-[10px]' : 'rounded-2xl');
  const markSize = Math.round(size * 0.78);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-[#1c1c1e] ring-1 ring-white/10 ${radius} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" fill="none">
        <path
          d="M8 23C13 23 12 11 23 10"
          stroke="#ffffff"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <circle cx="23" cy="10" r="3.6" fill="#c8d158" />
      </svg>
    </span>
  );
}
