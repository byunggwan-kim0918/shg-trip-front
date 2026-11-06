/**
 * 파비콘·apple-icon·OG가 리터럴이라 색은 테마를 따르지 않는다. 앱만 반전시키면 탭과 사이드바가 다른 로고로 보인다.
 * 다크 캔버스와 잉크 사각형은 대비가 1.13이라 ring-white/10으로 가장자리만 분리한다.
 */
interface Props {
  /** 바깥 정사각형 한 변 px. */
  size?: number;
  /** 모서리 반경 클래스. 아이콘 스케일 규약(28px 이하 `rounded-[10px]`, 그 이상 `rounded-xl`). */
  radiusClassName?: string;
  className?: string;
}

export default function Logo({ size = 28, radiusClassName, className = '' }: Props) {
  const radius = radiusClassName ?? (size <= 28 ? 'rounded-[10px]' : 'rounded-xl');
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
