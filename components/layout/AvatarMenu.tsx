'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, UserPen, UserX } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { forceLogout } from '@/lib/api/fetchClient';
import Portal from '@/components/common/Portal';

export default function AvatarMenu() {
  const user = useAuthStore((s) => s.user);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
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
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg"
          aria-label="사용자 메뉴"
        >
          {initial}
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[10px] border border-card-border bg-card-bg shadow-lg">
          <div className="border-b border-divider px-4 py-3">
            <p className="truncate text-sm font-bold text-foreground">{user?.nickname ?? '사용자'}</p>
            <p className="truncate text-[11px] text-muted-2">{user?.email ?? ''}</p>
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
          <button
            type="button"
            onClick={() => { setOpen(false); setWithdrawOpen(true); }}
            className="flex w-full items-center gap-2.5 border-t border-divider px-4 py-2.5 text-left text-xs font-medium text-muted-2 transition-colors hover:bg-surface-hover"
          >
            <UserX size={14} aria-hidden="true" /> 회원 탈퇴
          </button>
        </div>
      )}

      <NicknameModal
        key={editOpen ? 'nick-open' : 'nick-closed'}
        open={editOpen}
        current={user?.nickname ?? ''}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          // 저장은 이미 성공했으므로 세션 갱신이 실패해도 모달을 닫는다.
          try { await fetchSession(); } catch { /* 세션 갱신 실패는 무시 */ }
          setEditOpen(false);
        }}
      />

      <WithdrawModal
        key={withdrawOpen ? 'withdraw-open' : 'withdraw-closed'}
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
}

const WITHDRAW_PHRASE = '탈퇴';

/** DELETE /api/users/me 계약: 확인 문구가 정확히 일치해야 처리된다. */
function WithdrawModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const valid = phrase.trim() === WITHDRAW_PHRASE;

  const withdraw = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirm: phrase.trim() }),
      });
      // 401이면 이미 탈퇴됐거나 세션이 끝나 BFF가 쿠키를 지운 상태다.
      if (res.status === 401) { window.location.href = '/login'; return; }
      if (!res.ok) throw new Error('탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
      window.location.href = '/';
      return;
    } catch (e) {
      setError(e instanceof Error ? e.message : '탈퇴 처리에 실패했어요.');
    }
    setBusy(false);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!busy) onClose(); }}>
        <div role="dialog" aria-modal="true" aria-label="회원 탈퇴" className="w-full max-w-sm rounded-[10px] border border-card-border bg-card-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-[17px] font-bold text-foreground">회원 탈퇴</h2>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-text-2">
            <li>내 여행 일정이 모두 삭제되고 되돌릴 수 없어요.</li>
            <li>공유한 일정 링크는 바로 열리지 않아요.</li>
            <li>같은 소셜 계정으로 다시 가입하면 새 계정으로 시작해요.</li>
          </ul>
          <label htmlFor="withdraw-phrase" className="mt-4 block text-xs font-semibold text-muted-2">
            계속하려면 &lsquo;{WITHDRAW_PHRASE}&rsquo;를 입력해 주세요
          </label>
          <input
            id="withdraw-phrase"
            ref={inputRef}
            type="text"
            value={phrase}
            onChange={(e) => { setPhrase(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter') { e.preventDefault(); withdraw(); }
            }}
            autoComplete="off"
            className="mt-1.5 w-full rounded-[10px] border border-card-border bg-surface-3 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-danger"
          />
          {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-[40px] rounded-[10px] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50">취소</button>
            <button type="button" onClick={withdraw} disabled={!valid || busy} className="min-h-[40px] rounded-[10px] bg-danger px-4 py-2 text-sm font-bold text-accent-fg transition-colors hover:opacity-90 disabled:opacity-50">{busy ? '처리 중...' : '탈퇴하기'}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** 온보딩과 같은 계약: PATCH /api/proxy/users/profile, 2~20자. */
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
  const valid = trimmed.length >= 2 && trimmed.length <= 20 && trimmed !== current.trim();

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
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!busy) onClose(); }}>
        <div role="dialog" aria-modal="true" aria-label="닉네임 변경" className="w-full max-w-sm rounded-[10px] border border-card-border bg-card-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-[17px] font-bold text-foreground">닉네임 변경</h2>
          <input
            ref={inputRef}
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter') { e.preventDefault(); save(); }
            }}
            maxLength={20}
            placeholder="닉네임 (2~20자)"
            className="mt-4 w-full rounded-[10px] border border-card-border bg-surface-3 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-[40px] rounded-[10px] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50">취소</button>
            <button type="button" onClick={save} disabled={!valid || busy} className="min-h-[40px] rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50">{busy ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
