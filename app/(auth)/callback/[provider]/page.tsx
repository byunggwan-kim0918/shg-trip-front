'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { RETURN_TO_PARAM, consumeReturnTo } from '@/lib/auth/returnTo';

/** BFF 콜백 응답 status → LoginErrorToast 에러 코드 */
function errorCodeFor(status: number): string {
  if (status === 400) return 'state_mismatch';
  if (status === 401 || status === 403) return 'auth_failed';
  return 'server_error';
}

class CallbackError extends Error {
  constructor(readonly code: string) {
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

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const provider = (params.provider as string).toUpperCase();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      router.replace(loginErrorUrl('denied'));
      return;
    }

    if (!code) {
      router.replace(loginErrorUrl('no_code'));
      return;
    }

    // BFF에 인가 코드 전달 (state 검증은 서버에서 처리)
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, code, state }),
    })
      .then((res) => {
        if (!res.ok) throw new CallbackError(errorCodeFor(res.status));
        return res.json();
      })
      .then((response) => {
        const { isNewUser } = response.data;

        // 신규 가입자는 returnTo를 남겨 두고 온보딩이 닉네임 저장 후 꺼내 쓴다
        if (isNewUser) {
          router.replace('/onboarding');
        } else {
          router.replace(consumeReturnTo() ?? '/main');
        }
      })
      .catch((e: unknown) => {
        // fetch 자체가 실패하면(네트워크·서버 다운) TypeError로 온다
        const code = e instanceof CallbackError ? e.code : 'server_error';
        router.replace(loginErrorUrl(code));
      });
  }, []);

  return (
    <LoadingSpinner message="로그인 처리 중..." />
  );
}
