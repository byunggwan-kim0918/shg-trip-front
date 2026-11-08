'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { RETURN_TO_PARAM, consumeReturnTo } from '@/lib/auth/returnTo';
import { WITHDRAWN_PARAM, clearWithdrawPending, isWithdrawPending, useWithdrawPending } from '@/lib/auth/withdrawal';

function errorCodeFor(status: number): string {
  if (status === 400) return 'state_mismatch';
  if (status === 401 || status === 403) return 'auth_failed';
  return 'server_error';
}

class CallbackError extends Error {
  constructor(readonly code: string, readonly status?: number, readonly serverMessage?: string,
              readonly serverCode?: string) {
    super(code);
  }
}

/** 실패해도 returnTo를 로그인 URL로 되돌려 재시도 때 다시 저장되게 한다 */
function loginErrorUrl(code: string): string {
  const params = new URLSearchParams({ error: code });
  const returnTo = consumeReturnTo();
  if (returnTo) params.set(RETURN_TO_PARAM, returnTo);
  return `/login?${params}`;
}

/** BFF 자체 오류는 영어 문구라 백엔드 재인증 오류만 그대로 보여 준다. */
const REAUTH_ERROR_CODES = new Set(['USER_004', 'USER_005', 'USER_006']);

function withdrawErrorMessage(e: unknown): string {
  if (e instanceof CallbackError && e.serverCode && REAUTH_ERROR_CODES.has(e.serverCode) && e.serverMessage) {
    return e.serverMessage;
  }
  if (e instanceof CallbackError && e.status === 401) return '로그인이 만료됐어요. 다시 로그인한 뒤 탈퇴해 주세요.';
  return '탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const calledRef = useRef(false);
  const withdrawing = useWithdrawPending();
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const provider = (params.provider as string).toUpperCase();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const withdrawFlow = isWithdrawPending();

    if (error) {
      if (!withdrawFlow) router.replace(loginErrorUrl('denied'));
      return;
    }

    if (!code) {
      router.replace(loginErrorUrl('no_code'));
      return;
    }

    // state 검증은 BFF 서버에서 한다.
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, code, state }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new CallbackError(errorCodeFor(res.status), res.status, body?.error, body?.code);
        }
        return res.json();
      })
      .then((response) => {
        if (response.data.withdrawn) {
          clearWithdrawPending();
          window.location.replace(`/?${WITHDRAWN_PARAM}=1`);
          return;
        }
        const { isNewUser } = response.data;

        // 신규 가입자는 returnTo를 남겨 두고 온보딩이 닉네임 저장 후 꺼내 쓴다
        if (isNewUser) {
          router.replace('/onboarding');
        } else {
          router.replace(consumeReturnTo() ?? '/main');
        }
      })
      .catch((e: unknown) => {
        // fetch 자체가 실패하면(네트워크·서버 다운) CallbackError가 아니라 TypeError로 온다.
        if (withdrawFlow) {
          setWithdrawError(withdrawErrorMessage(e));
          return;
        }
        const code = e instanceof CallbackError ? e.code : 'server_error';
        router.replace(loginErrorUrl(code));
      });
  }, []);

  const shownError = withdrawing && searchParams.get('error')
    ? '본인 확인을 취소했어요. 탈퇴는 진행되지 않았어요.'
    : withdrawError;

  if (shownError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-semibold text-foreground">{shownError}</p>
        <Link href="/main" className="min-h-[40px] rounded-[10px] bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg">
          돌아가기
        </Link>
      </div>
    );
  }

  return (
    <LoadingSpinner message={withdrawing ? '본인 확인 중...' : '로그인 처리 중...'} />
  );
}
