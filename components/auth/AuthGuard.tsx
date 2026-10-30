'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, type UserInfo } from '@/lib/stores';
import { RETURN_TO_PARAM, sanitizeReturnTo } from '@/lib/auth/returnTo';

type Phase = 'checking' | 'ready' | 'unavailable';

interface SessionCheck {
  status: number;
  body: { data?: { isAuthenticated?: boolean; user?: UserInfo | null } } | null;
}

// 동시에 두 번 확인하면(StrictMode 이중 effect 등) 만료 토큰으로 refresh가 두 번 나가고,
// 백엔드는 회전된 refresh_token 재사용을 탈취로 보고 세션을 전부 끊는다.
let pendingCheck: Promise<SessionCheck> | null = null;

function checkSession(): Promise<SessionCheck> {
  pendingCheck ??= fetch('/api/auth/session', { credentials: 'include' })
    .then(async (res) => ({ status: res.status, body: res.ok ? await res.json() : null }))
    .finally(() => {
      pendingCheck = null;
    });
  return pendingCheck;
}

interface AuthGuardProps {
  children: React.ReactNode;
  /** 세션 확인 중 보여줄 화면. 미들웨어가 쿠키 존재는 이미 확인했으므로 레이아웃 골격을 먼저 그린다. */
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const [phase, setPhase] = useState<Phase>(isDemo ? 'ready' : 'checking');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // 스토어의 fetchSession은 5xx와 미인증을 구분하지 못한다. 5xx에 /login으로 보내면
  // 미들웨어가 쿠키를 보고 /main으로 되돌려 무한히 튕기므로 여기서 직접 판정한다.
  const applyCheck = useCallback(({ status, body }: SessionCheck) => {
    if (status >= 500) {
      setPhase('unavailable');
      return;
    }
    useAuthStore.setState({
      user: body?.data?.user ?? null,
      isAuthenticated: body?.data?.isAuthenticated === true,
    });
    setPhase('ready');
  }, []);

  const verify = useCallback(() => {
    checkSession().then(applyCheck, () => setPhase('unavailable'));
  }, [applyCheck]);

  useEffect(() => {
    if (!isDemo) verify();
  }, [verify, isDemo]);

  useEffect(() => {
    if (phase === 'ready' && !isAuthenticated && !isDemo) {
      // force=true는 미들웨어가 남은 쿠키를 지운 뒤 /login으로 보낸다(서로 튕기는 경로 차단)
      const params = new URLSearchParams({ force: 'true' });
      const returnTo = sanitizeReturnTo(pathname + window.location.search);
      if (returnTo) params.set(RETURN_TO_PARAM, returnTo);
      router.replace(`/login?${params.toString()}`);
    }
  }, [phase, isAuthenticated, isDemo, pathname, router]);

  // 닉네임이 없으면 onboarding으로 리다이렉트
  useEffect(() => {
    if (phase === 'ready' && isAuthenticated && !isDemo && user && !user.nickname) {
      router.replace('/onboarding');
    }
  }, [phase, isAuthenticated, isDemo, user, router]);

  if (phase === 'unavailable') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="flex w-full max-w-[360px] flex-col items-start rounded-xl border border-card-border bg-card-bg p-6">
          <h1 className="text-[17px] font-bold text-foreground">서버에 연결하지 못했어요</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            로그인 상태를 확인하는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <div className="mt-5 flex w-full gap-2">
            <button
              type="button"
              onClick={() => {
                setPhase('checking');
                verify();
              }}
              className="flex-1 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg transition-[filter] hover:brightness-105"
            >
              다시 시도
            </button>
            <a
              href="/login?force=true"
              className="flex-1 rounded-[10px] border border-card-border px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              다시 로그인
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase !== 'ready' || (!isAuthenticated && !isDemo)) return <>{fallback}</>;
  // 닉네임 미설정 시 children 렌더링 차단
  if (!isDemo && user && !user.nickname) return <>{fallback}</>;

  return <>{children}</>;
}
