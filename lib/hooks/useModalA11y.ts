'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

// 모달이 겹쳐 열리고 닫히는 순서가 어긋나도 마지막 모달이 닫힐 때만 스크롤을 푼다.
let lockCount = 0;
let savedOverflow: Array<[HTMLElement, string]> = [];

function lockScroll() {
  if (lockCount++ > 0) return;
  // 앱 화면은 body가 아니라 <main>이 스크롤된다.
  const targets = [document.body, ...Array.from(document.querySelectorAll<HTMLElement>('main'))];
  savedOverflow = targets.map((el) => [el, el.style.overflow]);
  targets.forEach((el) => { el.style.overflow = 'hidden'; });
}

function unlockScroll() {
  if (--lockCount > 0) return;
  lockCount = 0;
  savedOverflow.forEach(([el, value]) => { el.style.overflow = value; });
  savedOverflow = [];
}

function isFocusable(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

/**
 * 모달이 열려 있는 동안 Tab이 뒤 화면으로 나가지 않게 가두고, 뒤 화면 스크롤을 막고,
 * 닫히면 연 버튼으로 포커스를 돌려준다. 첫 포커스와 Esc 처리는 모달마다 다르므로 각 모달이 맡는다.
 * 연 요소를 잡아야 하므로 모달 안 입력칸에 포커스를 주는 effect보다 먼저 호출해야 한다.
 */
export function useModalA11y(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  // 메뉴 항목처럼 모달을 연 요소가 열리면서 사라지는 경우 대신 돌아갈 곳.
  returnFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : null;
    const fallback = returnFocusRef?.current ?? null;
    lockScroll();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isFocusable);
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const inside = dialogRef.current.contains(current);
      if (e.shiftKey && (current === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (current === last || !inside)) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
      const target = active && document.contains(active) ? active : fallback;
      target?.focus();
    };
  }, [open, dialogRef, returnFocusRef]);
}
