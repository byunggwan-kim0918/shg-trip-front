import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
  /** 오류 코드 (예: GEN_TIMEOUT_504). */
  errorCode?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/** 생성 실패 등 전면 에러 (4e). ! 아이콘 카드 + 액션 2개 + 오류코드. */
export default function ErrorState({
  title = '일정을 만들지 못했어요',
  description = 'AI 응답에 문제가 생겼어요. 잠시 후 다시 시도하거나 조건을 조금 바꿔보세요.',
  errorCode,
  retryLabel = '다시 시도',
  onRetry,
  secondaryLabel,
  onSecondary,
  className = '',
}: Props) {
  return (
    <div
      className={`rounded-[18px] border border-danger/30 bg-card-bg px-6 py-8 text-center ${className}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertCircle size={26} aria-hidden="true" />
      </div>
      <div className="text-lg font-extrabold tracking-[-0.02em] text-foreground">{title}</div>
      <div className="mt-2 text-[13.5px] leading-relaxed text-muted">{description}</div>
      <div className="mt-5 flex justify-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-[filter] hover:brightness-105"
          >
            <RotateCcw size={14} aria-hidden="true" /> {retryLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-card-border bg-card-bg px-5 py-3 text-sm font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
      {errorCode && (
        <div className="mt-4 text-[11.5px] text-muted-2">오류 코드 · {errorCode}</div>
      )}
    </div>
  );
}
