import Link from 'next/link';
import Logo from '@/components/common/Logo';

export const metadata = {
  title: '페이지를 찾을 수 없어요 · SHG trip',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[380px] flex-col items-start text-left">
        <Logo size={48} className="mb-6" />
        <p className="text-[13px] font-bold text-accent-weak-fg tabular-nums">404</p>
        <h1 className="mt-1 text-[23px] font-extrabold tracking-[-0.02em] text-foreground">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          주소가 바뀌었거나 삭제된 페이지입니다. 주소를 다시 확인해 주세요.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-fg transition-[filter] hover:brightness-105"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
