'use client';

import { AlertTriangle, X } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  /** 액션 버튼 라벨 (예: 재연결). */
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

/**
 * 하단 고정 토스트 (4e). 라이트에선 의도된 반전(어두운) 표면.
 * 다크에선 배경(#0d0e12)과 명도가 가까워 가장자리가 사라지므로 ring-white/12로 테두리를 만든다.
 * (그림자는 다크 배경에서 분리 효과가 없다.)
 * 네트워크 끊김/일시 오류 안내용. 전역 토스트 시스템 대신 소비처에서 조건부 렌더한다.
 */
export default function Toast({ title, description, actionLabel, onAction, onClose }: Props) {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 rounded-xl bg-[#14161c] px-4 py-3.5 ring-1 ring-white/12 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.5)]"
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-danger/25 text-danger">
        <AlertTriangle size={15} aria-hidden="true" />
      </span>
      <div className="flex-1">
        <div className="text-[13px] font-bold text-white">{title}</div>
        {description && <div className="mt-0.5 text-xs text-[#9aa1ac]">{description}</div>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-[10px] bg-[#2a2e38] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="shrink-0 text-[#9aa1ac] transition-colors hover:text-white"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
