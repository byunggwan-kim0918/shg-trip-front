import Link from 'next/link';
import Logo from '@/components/common/Logo';
import ThemeToggle from '@/components/common/ThemeToggle';
import AuthNavLink from './AuthNavLink';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-header-bg backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Logo size={26} />
          <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          <Link href="/trips" className="text-sm font-semibold text-text-2 transition-colors hover:text-foreground">
            여행 코스
          </Link>
          <ThemeToggle />
          <AuthNavLink />
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-divider py-8 text-center">
      <nav className="mb-2 flex justify-center gap-4 text-xs text-text-2">
        <Link href="/trips" className="inline-flex min-h-[44px] items-center transition-colors hover:text-foreground">여행 코스</Link>
        <Link href="/terms" className="inline-flex min-h-[44px] items-center transition-colors hover:text-foreground">이용약관</Link>
        <Link href="/privacy" className="inline-flex min-h-[44px] items-center transition-colors hover:text-foreground">개인정보처리방침</Link>
      </nav>
      <p className="text-xs text-muted-2">&copy; 2026 SHG trip</p>
    </footer>
  );
}
