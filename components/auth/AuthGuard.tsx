'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (isDemo) {
      setIsVerified(true);
      return;
    }
    fetchSession().then(() => setIsVerified(true));
  }, [fetchSession, isDemo]);

  useEffect(() => {
    if (isVerified && !isAuthenticated && !isDemo) {
      router.replace('/login');
    }
  }, [isVerified, isAuthenticated, isDemo, router]);

  // 닉네임이 없으면 onboarding으로 리다이렉트
  useEffect(() => {
    if (isVerified && isAuthenticated && !isDemo && user && !user.nickname) {
      router.replace('/onboarding');
    }
  }, [isVerified, isAuthenticated, isDemo, user, router]);

  if (!isVerified || (!isAuthenticated && !isDemo)) return null;
  // 닉네임 미설정 시 children 렌더링 차단
  if (!isDemo && user && !user.nickname) return null;

  return <>{children}</>;
}
