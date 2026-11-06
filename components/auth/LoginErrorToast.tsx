'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/common/Toast';
import { RETURN_TO_PARAM, sanitizeReturnTo } from '@/lib/auth/returnTo';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  denied: {
    title: '로그인이 취소되었습니다',
    description: '소셜 로그인 동의를 완료해 주세요.',
  },
  no_code: {
    title: '로그인에 실패했습니다',
    description: '인증 정보가 전달되지 않았습니다. 다시 시도해 주세요.',
  },
  state_mismatch: {
    title: '로그인 요청이 만료되었습니다',
    description: '로그인 창을 여러 번 열었거나 시간이 지나 확인에 실패했습니다. 다시 시도해 주세요.',
  },
  auth_failed: {
    title: '소셜 계정 인증에 실패했습니다',
    description: '인증 정보를 확인하지 못했습니다. 다시 로그인하거나 다른 계정으로 시도해 주세요.',
  },
  server_error: {
    title: '로그인에 실패했습니다',
    description: '서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  },
};

/** 표시 후 `?error=`를 지워야 새로고침 때 다시 뜨지 않는다. */
export default function LoginErrorToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('error');
    if (!code) return;

    setError(code);
    // error만 지운다. returnTo는 재시도 때 필요하다
    const returnTo = sanitizeReturnTo(searchParams.get(RETURN_TO_PARAM));
    router.replace(
      returnTo ? `/login?${new URLSearchParams({ [RETURN_TO_PARAM]: returnTo })}` : '/login',
      { scroll: false },
    );
  }, [searchParams, router]);

  if (!error) return null;

  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.server_error;

  return (
    // 분할 레이아웃에서 중앙 정렬하면 토스트가 좌측 콜라주 위에 겹친다.
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 px-4">
      <div className="mx-auto flex w-full max-w-5xl justify-center md:justify-end">
        <div className="w-full max-w-[340px]">
          <Toast
            title={message.title}
            description={message.description}
            onClose={() => setError(null)}
          />
        </div>
      </div>
    </div>
  );
}
