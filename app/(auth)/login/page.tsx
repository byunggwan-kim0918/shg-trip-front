import { Suspense } from 'react';
import SocialLoginGroup from '@/components/auth/SocialLoginGroup';
import LoginErrorToast from '@/components/auth/LoginErrorToast';

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center">
      <Suspense fallback={null}>
        <LoginErrorToast />
      </Suspense>

      <div className="animate-fade-in-up mb-8 flex flex-col items-center">
        <div
          className="mb-5 flex h-[62px] w-[62px] items-center justify-center rounded-[18px] text-[28px] font-extrabold text-white shadow-[0_14px_30px_-12px_var(--accent)]"
          style={{ background: 'linear-gradient(140deg, var(--accent), oklch(0.62 0.15 200))' }}
        >
          S
        </div>
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-foreground">SHG trip</h1>
        <p className="mt-1.5 text-sm text-muted">한 문장으로 시작하세요</p>
      </div>

      <div className="animate-fade-in-up animation-delay-100 flex w-full max-w-[340px] flex-col gap-[11px]">
        <SocialLoginGroup />
      </div>

      <p className="animate-fade-in-up animation-delay-200 mt-6 text-center text-[11.5px] leading-relaxed text-muted-2">
        시작하면{' '}
        <a href="/terms" className="underline transition-colors hover:text-muted">이용약관</a>
        {' '}및{' '}
        <a href="/privacy" className="underline transition-colors hover:text-muted">개인정보처리방침</a>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}
