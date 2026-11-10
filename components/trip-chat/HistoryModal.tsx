'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Portal from '@/components/common/Portal';
import { useModalA11y } from '@/lib/hooks/useModalA11y';
import type { TripChat } from '@/lib/types/tripChat';

interface Props {
  open: boolean;
  chat: TripChat;
  busy: boolean;
  onClose: () => void;
  onRestart: () => void;
}

export default function HistoryModal({ open, chat, busy, onClose, onRestart }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalA11y(open, dialogRef);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 열릴 때 한 번만 포커스한다. 대화가 갱신될 때마다 다시 잡으면 키보드 위치를 빼앗는다.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const rows = chat.summary.rows.filter((r) => r.filled);

  return (
    <Portal>
      <div className="shg-backdrop-in fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-title"
          onClick={(e) => e.stopPropagation()}
          className="shg-pop-in max-h-[80dvh] w-full max-w-[520px] overflow-y-auto rounded-[20px] border border-card-border bg-card-bg p-[25px] shadow-[0_20px_80px_rgba(0,0,0,0.13)]"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="history-title" className="text-[17px] font-bold tracking-[-0.5px] text-foreground">지금까지 나눈 이야기</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="답변 모아보기 닫기"
              className="grid size-8 place-items-center rounded-full bg-field text-muted transition-colors hover:text-foreground pointer-coarse:size-11"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="pb-[18px] pt-[22px] text-sm text-muted">나눈 이야기를 여기에 모아둘게요.</p>
          ) : (
            <>
              <dl>
                {rows.map((row) => (
                  <div key={row.slot} className="grid grid-cols-[63px_minmax(0,1fr)] gap-3 border-b border-card-border py-3.5 text-[13px]">
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="text-foreground [overflow-wrap:anywhere]">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {chat.history.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer py-2 text-[13px] text-muted pointer-coarse:min-h-11">나눈 대화 보기</summary>
                  {chat.history.map((h, i) => (
                    <div key={i} className="mt-[15px] border-b border-card-border pb-3">
                      <p className="text-xs text-muted">{h.question}</p>
                      <p className="mt-[5px] whitespace-pre-wrap text-xs text-foreground [overflow-wrap:anywhere]">{h.answer}</p>
                    </div>
                  ))}
                </details>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onRestart}
            disabled={busy}
            className="pt-[15px] text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40 pointer-coarse:min-h-11"
          >
            처음부터 다시 이야기하기
          </button>
        </div>
      </div>
    </Portal>
  );
}
