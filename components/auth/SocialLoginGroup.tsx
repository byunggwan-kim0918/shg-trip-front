'use client';

import { useEffect, useRef, useState } from 'react';
import SocialLoginButton from './SocialLoginButton';
import { type Provider, getOAuthUrl } from '@/lib/auth/oauthConfig';
import { RETURN_TO_PARAM, saveReturnTo } from '@/lib/auth/returnTo';

const PROVIDERS: Provider[] = ['KAKAO', 'GOOGLE', 'NAVER'];

export default function SocialLoginGroup() {
  // 두 번 누르면 oauth-state가 두 번 발급돼 쿠키엔 나중 값만 남고, 먼저 열린 인증으로 돌아오면 state 불일치가 난다.
  // 상태 갱신 전 같은 틱의 두 번째 클릭까지 막으려고 ref로 잠근다.
  const lockRef = useRef(false);
  const [pending, setPending] = useState<Provider | null>(null);

  // 제공자 화면에서 뒤로가기로 돌아오면 bfcache가 잠긴 상태를 그대로 복원한다
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      lockRef.current = false;
      setPending(null);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const start = async (provider: Provider) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setPending(provider);
    try {
      saveReturnTo(new URLSearchParams(window.location.search).get(RETURN_TO_PARAM));
      window.location.assign(await getOAuthUrl(provider));
    } catch {
      lockRef.current = false;
      setPending(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2.5">
      {PROVIDERS.map((provider) => (
        <SocialLoginButton
          key={provider}
          provider={provider}
          disabled={pending !== null}
          loading={pending === provider}
          onClick={() => start(provider)}
        />
      ))}
    </div>
  );
}
