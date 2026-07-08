'use client';

import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 위험한 동작(삭제 등)이면 확인 버튼을 danger 색으로 */
  danger?: boolean;
  /** 확인 처리 중 버튼 비활성화 */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 간단한 확인 모달. ESC 닫기 + aria-modal + 확인 버튼 오토포커스. */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-xl bg-card-bg border border-card-border shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50 min-h-[40px]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 min-h-[40px] ${
              danger ? 'bg-danger hover:opacity-90' : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {busy ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
