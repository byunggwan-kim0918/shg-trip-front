interface Props {
  children: React.ReactNode;
  /** 'surface' = 카드 테마칩(surface-3), 'accent' = accent-weak 칩(이해 패널 테마) */
  variant?: 'surface' | 'accent';
  className?: string;
}

/** 테마/카테고리 칩. 라이트/다크 토큰 자동. */
export default function TagChip({ children, variant = 'surface', className = '' }: Props) {
  const styles =
    variant === 'accent'
      ? 'bg-accent-soft text-accent-weak-fg'
      : 'bg-surface-3 text-muted';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11.5px] font-semibold ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
