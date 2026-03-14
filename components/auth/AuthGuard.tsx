'use client';

import { useEffect, useState } from 'react';
import { getRefreshPromise, forceLogout } from '@/lib/api/fetchClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      // access token이 있으면 통과 (API 호출 시 authFetch가 401 처리)
      if (accessToken) {
        setIsVerified(true);
        return;
      }

      // access token 없으면 refresh 시도 (새 탭, 페이지 새로고침 등)
      const newToken = await getRefreshPromise();
      if (newToken) {
        setIsVerified(true);
      } else {
        forceLogout();
      }
    };

    verify();
  }, []);

  if (!isVerified) return null;

  return <>{children}</>;
}
