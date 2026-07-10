'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Toast from '@/components/common/Toast';

/** 로그인 에러 코드 → 사용자 메시지 매핑. */
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  denied: {
    title: '로그인이 취소되었습니다',
    description: '소셜 로그인 동의를 완료해 주세요.',
  },
  no_code: {
    title: '로그인에 실패했습니다',
    description: '인증 정보가 전달되지 않았습니다. 다시 시도해 주세요.',
  },
  auth_failed: {
    title: '로그인에 실패했습니다',
    description: '서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  },
};

/**
 * login 페이지에서 `?error=` 쿼리를 읽어 토스트로 안내한다.
 * 표시 후 쿼리 파라미터를 제거해 새로고침 시 재노출을 방지한다.
 */
export default function LoginErrorToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('error');
    if (!code) return;

    setError(code);
    // 쿼리 제거 (히스토리 오염 방지)
    router.replace('/login', { scroll: false });
  }, [searchParams, router]);

  if (!error) return null;

  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.auth_failed;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="w-full max-w-[340px]">
        <Toast
          title={message.title}
          description={message.description}
          onClose={() => setError(null)}
        />
      </div>
    </div>
  );
}
