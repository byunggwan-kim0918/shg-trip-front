'use client';

import { useEffect, useRef, type RefObject } from 'react';
import Portal from '@/components/common/Portal';
import { useModalA11y } from '@/lib/hooks/useModalA11y';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  /** 연 버튼이 메뉴 안에 있어 열리면서 사라질 때 닫은 뒤 돌아갈 곳. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  busy = false,
  returnFocusRef,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, dialogRef, returnFocusRef);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          e.stopPropagation();
          if (!busy) onCancel();
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-sm rounded-[10px] bg-card-bg border border-card-border shadow-xl p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              disabled={busy}
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={(e) => { e.stopPropagation(); onConfirm(); }}
              disabled={busy}
              className={`px-4 py-2 rounded-[10px] text-sm font-medium text-accent-fg transition-colors disabled:opacity-50 min-h-[44px] ${
                danger ? 'bg-danger hover:opacity-90' : 'bg-accent hover:bg-accent-hover'
              }`}
            >
              {busy ? '처리 중...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
