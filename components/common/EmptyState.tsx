import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** dashed border 강조 (결과 없음 등). */
  dashed?: boolean;
  className?: string;
}

/** 빈 상태 (4e). 아이콘 박스 + 제목 + 설명 + 액션 버튼. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  dashed = false,
  className = '',
}: Props) {
  return (
    <div
      className={`flex flex-col items-center rounded-[18px] px-6 py-8 text-center ${
        dashed ? 'border border-dashed border-card-border bg-card-bg' : 'bg-card-bg border border-card-border'
      } ${className}`}
    >
      <span className="mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-surface-3 text-muted-2">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="text-base font-extrabold text-foreground">{title}</div>
      {description && (
        <div className="mt-1.5 text-[13px] leading-relaxed text-muted">{description}</div>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl border border-card-border bg-surface-2 px-5 py-2.5 text-[13.5px] font-semibold text-text-2 transition-colors hover:bg-surface-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
