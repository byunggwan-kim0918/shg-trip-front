'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const provider = (params.provider as string).toUpperCase();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      router.replace('/login?error=denied');
      return;
    }

    if (!code) {
      router.replace('/login?error=no_code');
      return;
    }

    // state 검증 (CSRF 방지)
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      router.replace('/login?error=invalid_state');
      return;
    }
    sessionStorage.removeItem('oauth_state');

    // 백엔드에 인가 코드 전달
    fetch('/api/auth/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('auth_failed');
        return res.json();
      })
      .then((data) => {
        if (data.isNewUser) {
          router.replace('/onboarding');
        } else {
          router.replace('/main');
        }
      })
      .catch(() => {
        router.replace('/login?error=auth_failed');
      });
  }, [params.provider, searchParams, router]);

  return (
    <LoadingSpinner message="로그인 처리 중..." />
  );
}
