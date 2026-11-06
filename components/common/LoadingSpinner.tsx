interface Props {
  message?: string;
  /** 지름 px. */
  size?: number;
}

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
