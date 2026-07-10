import { STATUS_META, type TripDisplayStatus } from '@/lib/utils/tripStatus';

interface Props {
  status: TripDisplayStatus;
  /** 라벨 텍스트 표시 여부 (기본 true). false면 점만. */
  showLabel?: boolean;
  /** 점 크기 px (기본 6). 사이드바는 8. */
  size?: number;
  className?: string;
}

/** 상태 점 + 라벨. 색은 CSS 변수 토큰이라 라이트/다크 자동 대응. */
export default function StatusDot({ status, showLabel = true, size = 6, className = '' }: Props) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="rounded-full shrink-0"
        style={{ width: size, height: size, background: meta.dotVar }}
      />
      {showLabel && (
        <span className="text-[11.5px] font-semibold" style={{ color: meta.fgVar }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
