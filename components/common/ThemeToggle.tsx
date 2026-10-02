'use client';

import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/stores';
import { toggleThemeWithTransition } from '@/lib/theme';

/**
 * 테마 토글 버튼.
 *
 * 원래 Header(=/main 레이아웃)에만 있어서 비로그인 방문자는 랜딩·로그인·온보딩에서
 * 테마를 바꿀 수 없었다. 테마는 적용되는데 전환 수단만 없는 상태였다.
 * 같은 컴포넌트를 세 진입 화면이 공유해 아이콘·크기·전환이 화면마다 달라지지 않게 한다.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useAppStore((s) => s.theme);
  return (
    <button
      type="button"
      onClick={toggleThemeWithTransition}
      className={`rounded-xl p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${className}`}
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
    >
      {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
    </button>
  );
}
