'use client';

import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/stores';
import { toggleThemeWithTransition } from '@/lib/theme';

/** 진입 화면들과 Header가 같은 컴포넌트를 써야 화면마다 아이콘·크기·전환이 달라지지 않는다. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useAppStore((s) => s.theme);
  return (
    <button
      type="button"
      onClick={toggleThemeWithTransition}
      className={`rounded-[10px] p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${className}`}
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
    >
      {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
    </button>
  );
}
