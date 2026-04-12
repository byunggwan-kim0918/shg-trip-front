'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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

  if (!isVerified || (!isAuthenticated && !isDemo)) return null;

  return <>{children}</>;
}
