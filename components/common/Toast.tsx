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
 * 하단 고정 토스트 (4e). 다크 배경 + 경고 아이콘 + 액션.
 * 네트워크 끊김/일시 오류 안내용. 전역 토스트 시스템 대신 소비처에서 조건부 렌더한다.
 */
export default function Toast({ title, description, actionLabel, onAction, onClose }: Props) {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-center gap-3 rounded-[14px] bg-[#14161c] px-4 py-3.5 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.5)]"
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-danger/25 text-danger">
        <AlertTriangle size={15} aria-hidden="true" />
      </span>
      <div className="flex-1">
        <div className="text-[13.5px] font-bold text-white">{title}</div>
        {description && <div className="mt-0.5 text-xs text-[#9aa1ac]">{description}</div>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-[9px] bg-[#2a2e38] px-3.5 py-2 text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
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
