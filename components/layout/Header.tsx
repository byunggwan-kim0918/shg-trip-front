'use client';

import Link from 'next/link';
import { Sun, Moon, PanelLeftOpen } from 'lucide-react';
import { useAppStore } from '@/lib/stores';
import { toggleThemeWithTransition } from '@/lib/theme';
import HeaderSearch from './HeaderSearch';
import AvatarMenu from './AvatarMenu';

export default function Header() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const theme = useAppStore((s) => s.theme);

  return (
    <header
      className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-header-border bg-header-bg px-5 backdrop-blur-xl"
      role="banner"
    >
      {/* 왼쪽: 사이드바 닫혀있을 때 로고 + 열기 버튼 */}
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <>
            <Link
              href="/main"
              aria-label="홈으로 이동"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span
                className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[13px] font-extrabold text-white"
                style={{ background: 'linear-gradient(140deg, var(--accent), oklch(0.62 0.15 200))' }}
              >
                S
              </span>
              <span className="text-[15px] font-bold text-foreground">SHG trip</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-muted hover:bg-surface-hover transition-colors"
              aria-label="사이드바 열기"
            >
              <PanelLeftOpen size={17} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* 검색 */}
      <HeaderSearch />

      {/* 오른쪽: 테마 토글 + 아바타 메뉴 */}
      <div className="ml-auto flex items-center gap-2.5">
        <button
          onClick={toggleThemeWithTransition}
          className="p-2 rounded-lg text-muted hover:bg-surface-hover transition-colors"
          aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        >
          {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
        </button>
        <AvatarMenu />
      </div>
    </header>
  );
}
