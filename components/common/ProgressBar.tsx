interface Props {
  /** 0~100. indeterminate=true면 무시. */
  value?: number;
  /** 불확정 로딩 바 (shg-indef). */
  indeterminate?: boolean;
  /** 바 높이 px (기본 10; 마법사 6). */
  height?: number;
  className?: string;
}

/** 선형 프로그레스 바 (4d). 확정(%) 또는 불확정(shg-indef). */
export default function ProgressBar({
  value = 0,
  indeterminate = false,
  height = 10,
  className = '',
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-surface-3 ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <div
          className="absolute top-0 h-full w-2/5 rounded-full bg-accent shg-indef"
          style={{ left: '-40%' }}
        />
      ) : (
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${clamped}%`,
            background: 'linear-gradient(90deg, var(--accent), oklch(0.62 0.15 200))',
          }}
        />
      )}
    </div>
  );
}
