'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const fetchSession = useAuthStore((s) => s.fetchSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    fetchSession().then(() => setIsVerified(true));
  }, [fetchSession]);

  useEffect(() => {
    if (isVerified && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isVerified, isAuthenticated, router]);

  if (!isVerified || !isAuthenticated) return null;

  return <>{children}</>;
}
