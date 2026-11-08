import { STATUS_META, type TripDisplayStatus } from '@/lib/utils/tripStatus';

interface Props {
  status: TripDisplayStatus;
  showLabel?: boolean;
  /** 점 크기 px. */
  size?: number;
  className?: string;
}

export default function StatusDot({ status, showLabel = true, size = 6, className = '' }: Props) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="rounded-full shrink-0"
        style={{ width: size, height: size, background: meta.dotVar }}
      />
      {showLabel && (
        <span className="text-xs font-semibold" style={{ color: meta.fgVar }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
