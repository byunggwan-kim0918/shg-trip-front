'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

const LINK_CLASS =
  'rounded-[10px] border border-card-border px-4 py-2 text-[13px] font-bold text-foreground transition-colors hover:bg-surface-hover';

/** 공개 코스 페이지는 정적으로 만들어 로그인 여부를 모르므로 브라우저에서 세션을 확인해 버튼을 고른다. */
export default function AuthNavLink() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => { if (!cancelled && body?.data?.isAuthenticated) setSignedIn(true); })
      .catch(() => { /* 확인 실패면 로그인 버튼을 그대로 둔다 */ });
    return () => { cancelled = true; };
  }, []);

  return signedIn
    ? <Link href={ROUTES.trips} className={LINK_CLASS}>내 여행</Link>
    : <Link href="/login" className={LINK_CLASS}>로그인</Link>;
}
