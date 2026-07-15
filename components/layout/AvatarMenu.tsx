'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, UserPen } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { forceLogout } from '@/lib/api/fetchClient';

/** 헤더 아바타 드롭다운: 닉네임 표시 / 닉네임 변경 / 로그아웃. */
export default function AvatarMenu() {
  const user = useAuthStore((s) => s.user);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const initial = user?.nickname?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div ref={boxRef} className="relative">
      {user?.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profileImage}
          alt=""
          className="h-[30px] w-[30px] cursor-pointer rounded-full object-cover"
          role="button"
          tabIndex={0}
          aria-label="사용자 메뉴"
          referrerPolicy="no-referrer"
          onClick={() => setOpen((v) => !v)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
          aria-label="사용자 메뉴"
        >
          {initial}
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-lg">
          <div className="border-b border-divider px-4 py-3">
            <p className="truncate text-sm font-bold text-foreground">{user?.nickname ?? '사용자'}</p>
            <p className="truncate text-[11.5px] text-muted-2">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); setEditOpen(true); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            <UserPen size={15} aria-hidden="true" /> 닉네임 변경
          </button>
          <button
            type="button"
            onClick={forceLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-danger transition-colors hover:bg-surface-hover"
          >
            <LogOut size={15} aria-hidden="true" /> 로그아웃
          </button>
        </div>
      )}

      <NicknameModal
        key={editOpen ? 'nick-open' : 'nick-closed'}
        open={editOpen}
        current={user?.nickname ?? ''}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          // fetchSession 실패해도 저장은 성공했으므로 모달은 닫는다(unhandled rejection 방지).
          try { await fetchSession(); } catch { /* 세션 갱신 실패는 무시 */ }
          setEditOpen(false);
        }}
      />
    </div>
  );
}

/** 닉네임 변경 모달 (온보딩과 동일 계약: PATCH /api/proxy/users/profile, 2~20자). */
function NicknameModal({
  open,
  current,
  onClose,
  onSaved,
}: {
  open: boolean;
  current: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNickname(current);
    setError(null);
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, current, busy, onClose]);

  if (!open) return null;

  const trimmed = nickname.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 20;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nickname: trimmed }),
      });
      if (!res.ok) throw new Error('닉네임 변경에 실패했어요.');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '닉네임 변경에 실패했어요.');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="닉네임 변경" className="w-full max-w-sm rounded-xl border border-card-border bg-card-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-foreground">닉네임 변경</h2>
        <input
          ref={inputRef}
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
          maxLength={20}
          placeholder="닉네임 (2~20자)"
          className="mt-4 w-full rounded-xl border border-card-border bg-surface-3 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
        />
        {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="min-h-[40px] rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50">취소</button>
          <button type="button" onClick={save} disabled={!valid || busy} className="min-h-[40px] rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">{busy ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}
