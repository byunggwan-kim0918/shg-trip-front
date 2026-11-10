'use client';

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export interface AnswerComposerHandle {
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  /** 입력창 아래 안내. 없으면 감춘다. */
  hint?: string | null;
  sendLabel?: string;
}

const MAX_LENGTH = 700;
const MAX_HEIGHT = 180;

/** Enter 전송, Shift+Enter 줄바꿈. 한글 조합 중 Enter는 조합 확정이라 보내지 않는다. */
const AnswerComposer = forwardRef<AnswerComposerHandle, Props>(function AnswerComposer(
  { value, onChange, onSubmit, placeholder, label, disabled = false, hint = '한마디로 답해도 괜찮아요.', sendLabel = '답변 보내기' },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }), []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const canSend = !disabled && value.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
    >
      <div className="flex items-end gap-3 rounded-[11px] border border-card-border bg-field py-2.5 pl-3.5 pr-[11px] transition-[border-color,outline-color] duration-150 focus-within:border-accent focus-within:outline focus-within:outline-1 focus-within:outline-accent">
        <label className="sr-only" htmlFor={inputId}>{label}</label>
        <textarea
          id={inputId}
          ref={textareaRef}
          rows={2}
          value={value}
          maxLength={MAX_LENGTH}
          placeholder={placeholder}
          disabled={disabled}
          enterKeyHint="send"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          onFocus={(e) => {
            // 작은 화면에서는 키보드가 올라온 뒤 입력창이 가리지 않게 보이는 곳으로 옮긴다.
            if (!window.matchMedia('(pointer: coarse)').matches) return;
            const el = e.currentTarget;
            setTimeout(() => el.scrollIntoView({ block: 'nearest' }), 300);
          }}
          className="min-h-[49px] w-full min-w-0 resize-none bg-transparent py-0.5 text-base leading-[1.65] text-foreground outline-none placeholder:text-muted-2 disabled:opacity-60 sm:text-sm"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={sendLabel}
          className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-accent text-accent-fg transition-[filter,opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-95 active:scale-[0.94] disabled:cursor-default disabled:opacity-40 disabled:hover:brightness-100 pointer-coarse:size-11"
        >
          <ArrowUp size={19} aria-hidden="true" />
        </button>
      </div>
      {hint !== null && (
        <div className="mt-2 flex items-center justify-between gap-2.5 text-[11px] text-muted">
          <span>{hint}</span>
          <span className="hidden whitespace-nowrap sm:inline">Enter로 보내기</span>
        </div>
      )}
    </form>
  );
});

export default AnswerComposer;
