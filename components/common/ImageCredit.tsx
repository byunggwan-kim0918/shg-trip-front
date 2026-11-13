'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import Portal from './Portal';

const VIEWPORT_MARGIN = 8;
const POPOVER_GAP = 6;

const TRIGGER_SIZE = {
  sm: { box: 'h-3.5 w-3.5 after:-inset-1.5', icon: 14 },
  md: { box: 'h-4 w-4 after:-inset-2.5', icon: 16 },
} as const;

interface Props {
  credit?: string | null;
  license?: string | null;
  /** 원본 파일 페이지. http(s)가 아니면 링크를 만들지 않는다. */
  sourceUrl?: string | null;
  /** 사진 위 위치(`bottom-1 right-1` 등). 버튼은 항상 absolute다. */
  className?: string;
  /** sm은 44px 썸네일용이다. */
  size?: 'sm' | 'md';
}

/** 사진 위 ⓘ 버튼. 저작자·라이선스가 하나라도 있을 때만 그린다. */
export default function ImageCredit({ credit, license, sourceUrl, className = '', size = 'md' }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const popoverId = useId();
  const titleId = useId();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // 사진 칸이 overflow-hidden이라 팝오버를 body로 내보내고 버튼 기준 좌표를 직접 잡는다.
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = popover;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.right - width, window.innerWidth - width - VIEWPORT_MARGIN));
    const below = rect.bottom + POPOVER_GAP;
    const top = below + height <= window.innerHeight - VIEWPORT_MARGIN
      ? below
      : Math.max(VIEWPORT_MARGIN, rect.top - POPOVER_GAP - height);
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    // body 끝에 붙어 있어 포커스를 옮기지 않으면 Tab으로 닿지 않는다.
    popover.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    // 고정 좌표라 스크롤·지도 확대를 따라가지 못하므로 닫는다.
    const dismiss = () => setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('wheel', dismiss, { passive: true });
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  const text = [credit, license].map((v) => v?.trim()).filter(Boolean).join(' · ');
  if (!text) return null;
  const href = sourceUrl && /^https?:\/\//i.test(sourceUrl) ? sourceUrl : null;
  const trigger = TRIGGER_SIZE[size];

  const onPopoverKeyDown = (e: React.KeyboardEvent) => {
    // 포털 안 키 입력도 React 트리를 따라 카드의 Enter 처리까지 올라간다.
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      const toLink = !e.shiftKey && linkRef.current != null && document.activeElement !== linkRef.current;
      if (!toLink) {
        e.preventDefault();
        close(true);
      }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="사진 출처 보기"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        // 사진은 클릭하면 스톱을 고르거나 여행으로 이동하는 카드 안에 있다.
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className={`absolute flex items-center justify-center rounded-full bg-card-bg/80 text-muted transition-colors after:absolute after:content-[''] hover:bg-card-bg hover:text-foreground ${trigger.box} ${className}`}
      >
        <Info size={trigger.icon} aria-hidden="true" />
      </button>

      {open && (
        <Portal>
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onPopoverKeyDown}
            className="fixed left-0 top-0 z-50 w-max max-w-[240px] rounded-[10px] border border-card-border bg-card-bg px-3 py-2.5 shadow-lg outline-none"
          >
            <p id={titleId} className="text-[11px] font-semibold text-muted-2">사진 출처</p>
            <p className="mt-0.5 line-clamp-3 break-words text-xs text-text-2">{text}</p>
            {href && (
              <a
                ref={linkRef}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-accent-weak-fg hover:underline"
              >
                원본 보기 <ExternalLink size={11} aria-hidden="true" />
              </a>
            )}
          </div>
        </Portal>
      )}
    </>
  );
}
