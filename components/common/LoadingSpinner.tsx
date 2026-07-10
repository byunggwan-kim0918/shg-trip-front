interface Props {
  message?: string;
  /** 스피너 지름 px (기본 40). */
  size?: number;
}

/** 원형 스피너 (짧은 로딩 기본). border-top accent + shg-spin. */
export default function LoadingSpinner({ message, size = 40 }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="rounded-full border-[var(--surface-3)] shg-spin"
        style={{
          width: size,
          height: size,
          borderWidth: Math.max(3, Math.round(size / 12)),
          borderStyle: 'solid',
          borderTopColor: 'var(--accent)',
        }}
      />
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
