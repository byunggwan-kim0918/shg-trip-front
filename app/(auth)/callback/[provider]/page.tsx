'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
      router.replace('/login?error=denied');
      return;
    }

    if (!code) {
      router.replace('/login?error=no_code');
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
        if (!res.ok) throw new Error('auth_failed');
        return res.json();
      })
      .then((response) => {
        const { isNewUser } = response.data;

        if (isNewUser) {
          router.replace('/onboarding');
        } else {
          router.replace('/main');
        }
      })
      .catch(() => {
        router.replace('/login?error=auth_failed');
      });
  }, []);

  return (
    <LoadingSpinner message="로그인 처리 중..." />
  );
}
