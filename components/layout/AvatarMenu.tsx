'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { LogOut, UserPen, UserX } from 'lucide-react';
import { useAuthStore } from '@/lib/stores';
import { forceLogout } from '@/lib/api/fetchClient';
import { type Provider, getOAuthUrl } from '@/lib/auth/oauthConfig';
import { clearWithdrawPending } from '@/lib/auth/withdrawal';
import Portal from '@/components/common/Portal';
import { useModalA11y } from '@/lib/hooks/useModalA11y';

export default function AvatarMenu() {
  const user = useAuthStore((s) => s.user);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initial = user?.nickname?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div ref={boxRef} className="relative">
      {/* 이미지에 role=button만 주면 Enter·Space로 열리지 않아 실제 버튼으로 감싼다. 터치 영역은 44px. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
        title={user?.nickname ?? undefined}
        className="-m-[7px] flex h-11 w-11 items-center justify-center rounded-full"
      >
        {user?.profileImage && user.profileImage !== failedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImage}
            alt=""
            className="h-[30px] w-[30px] rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(user.profileImage ?? null)}
          />
        ) : (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-[10px] border border-card-border bg-card-bg shadow-lg">
          <div className="border-b border-divider px-4 py-3">
            <p className="truncate text-sm font-bold text-foreground" title={user?.nickname ?? undefined}>{user?.nickname ?? '사용자'}</p>
            <p className="truncate text-xs text-muted-2">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); setEditOpen(true); }}
            className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            <UserPen size={15} aria-hidden="true" /> 닉네임 변경
          </button>
          <button
            type="button"
            onClick={forceLogout}
            className="flex min-h-[44px] w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            <LogOut size={15} aria-hidden="true" /> 로그아웃
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setWithdrawOpen(true); }}
            className="flex min-h-[44px] w-full items-center gap-2.5 border-t border-divider px-4 py-2.5 text-left text-xs font-medium text-muted-2 transition-colors hover:bg-surface-hover"
          >
            <UserX size={14} aria-hidden="true" /> 회원 탈퇴
          </button>
        </div>
      )}

      <NicknameModal
        key={editOpen ? 'nick-open' : 'nick-closed'}
        open={editOpen}
        returnFocusRef={triggerRef}
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
        returnFocusRef={triggerRef}
        provider={user?.provider ?? null}
        onClose={() => setWithdrawOpen(false)}
      />
    </div>
  );
}

const WITHDRAW_PHRASE = '탈퇴';
const NAVIGATION_STALL_MS = 8000;

const PROVIDER_LABEL: Record<Provider, string> = { KAKAO: '카카오', NAVER: '네이버', GOOGLE: '구글' };

/** 문구 확인 후 가입한 소셜 계정으로 다시 로그인해야 탈퇴된다. 처리는 OAuth 콜백에서 한다. */
function WithdrawModal({ open, provider, returnFocusRef, onClose }: {
  open: boolean;
  provider: Provider | null;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, dialogRef, returnFocusRef);
  // 주소를 만드는 동안 닫으면 이동하지 않는다. 이동을 시작한 뒤에는 되돌릴 수 없으니 닫기를 막는다.
  const cancelledRef = useRef(false);
  const navigatingRef = useRef(false);
  const [navigating, setNavigatingState] = useState(false);
  const setNavigating = (value: boolean) => { navigatingRef.current = value; setNavigatingState(value); };

  const cancel = useCallback(() => {
    if (navigatingRef.current) return;
    cancelledRef.current = true;
    clearWithdrawPending();
    onClose();
  }, [onClose]);

  // 제공자 화면에서 뒤로 가면 bfcache가 '이동 중' 상태 그대로 복원한다.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) { setBusy(false); navigatingRef.current = false; setNavigatingState(false); }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') cancel(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, cancel]);

  if (!open) return null;

  const valid = phrase.trim() === WITHDRAW_PHRASE;
  const wrongPhrase = phrase.trim().length > 0 && !valid;

  const withdraw = async () => {
    if (!valid || busy || !provider) return;
    cancelledRef.current = false;
    setBusy(true);
    setError(null);
    try {
      const url = await getOAuthUrl(provider, 'withdraw');
      if (cancelledRef.current) { clearWithdrawPending(); return; }
      setNavigating(true);
      window.location.assign(url);
      // 이동이 막히면 페이지가 그대로 남으므로 잠시 뒤 다시 조작할 수 있게 푼다.
      setTimeout(() => { setNavigating(false); setBusy(false); }, NAVIGATION_STALL_MS);
    } catch {
      setError('본인 확인 화면을 열지 못했어요. 잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={cancel}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="회원 탈퇴" className="w-full max-w-sm rounded-[10px] border border-card-border bg-card-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-[17px] font-bold text-foreground">회원 탈퇴</h2>
          <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-text-2">
            <li>내 여행 일정이 모두 삭제되고 되돌릴 수 없어요.</li>
            <li>공유한 링크도 더 이상 열리지 않아요.</li>
            <li>같은 소셜 계정으로 다시 가입하면 새 계정으로 시작하지만, 남은 생성 횟수(30일 기준)는 그대로예요.</li>
            <li>본인 확인을 위해 {provider ? PROVIDER_LABEL[provider] : '소셜'} 로그인 화면으로 이동해요.</li>
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
            aria-invalid={wrongPhrase}
            aria-describedby={wrongPhrase ? 'withdraw-phrase-hint' : undefined}
            className={`mt-1.5 w-full rounded-[10px] border bg-surface-3 px-3.5 py-2.5 text-base text-foreground outline-none sm:text-sm ${
              wrongPhrase ? 'border-danger' : 'border-card-border focus:border-accent'
            }`}
          />
          {wrongPhrase && (
            <p id="withdraw-phrase-hint" className="mt-1.5 text-xs font-semibold text-danger">&lsquo;{WITHDRAW_PHRASE}&rsquo;를 정확히 입력해 주세요.</p>
          )}
          {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={cancel} disabled={navigating} className="min-h-[44px] rounded-[10px] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50">취소</button>
            <button type="button" onClick={withdraw} disabled={!valid || busy || !provider} className="min-h-[44px] rounded-[10px] bg-danger px-4 py-2 text-sm font-bold text-accent-fg transition-colors hover:opacity-90 disabled:opacity-50">{busy ? '이동 중...' : '본인 확인 후 탈퇴'}</button>
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
  returnFocusRef,
  onClose,
  onSaved,
}: {
  open: boolean;
  current: string;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, dialogRef, returnFocusRef);

  // 열 때마다 key로 새로 마운트되므로 초기값은 useState가 맡는다. 여기서 되돌리면 저장 실패 뒤
  // busy가 바뀔 때 입력값과 오류 문구가 함께 지워진다.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

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
      // 중복·보이지 않는 문자처럼 고칠 수 있는 이유는 서버 문구를 그대로 보여 준다.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        // 입력 검증 오류는 "nickname: …"처럼 필드명이 앞에 붙어 온다.
        const message: string | undefined = body?.error?.message?.replace(/^nickname:\s*/, '');
        throw new Error(message || '닉네임 변경에 실패했어요.');
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '닉네임 변경에 실패했어요.');
    }
    setBusy(false);
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!busy) onClose(); }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="닉네임 변경" className="w-full max-w-sm rounded-[10px] border border-card-border bg-card-bg p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
            className="mt-4 w-full rounded-[10px] border border-card-border bg-surface-3 px-3.5 py-2.5 text-base text-foreground outline-none focus:border-accent sm:text-sm"
          />
          {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-[44px] rounded-[10px] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50">취소</button>
            <button type="button" onClick={save} disabled={!valid || busy} className="min-h-[44px] rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50">{busy ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
