'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { WITHDRAWN_PARAM } from '@/lib/auth/withdrawal';

export default function WithdrawnNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || searchParams.get(WITHDRAWN_PARAM) !== '1') return null;

  const close = () => {
    setDismissed(true);
    router.replace('/', { scroll: false });
  };

  return (
    <div role="status" className="border-b border-divider bg-surface-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-10">
        <p className="text-sm font-semibold text-foreground">회원 탈퇴가 완료됐어요. 그동안 이용해 주셔서 감사합니다.</p>
        <button type="button" onClick={close} aria-label="닫기" className="shrink-0 rounded-[10px] p-1.5 text-muted-2 transition-colors hover:bg-surface-hover">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
