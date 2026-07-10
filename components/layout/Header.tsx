'use client';

import Link from 'next/link';
import { Search, Sun, Moon, PanelLeftOpen } from 'lucide-react';
import { useAppStore, useAuthStore } from '@/lib/stores';
import { toggleThemeWithTransition } from '@/lib/theme';

export default function Header() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);

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

      {/* 검색 (Layer A: UI만 — 검색 연동은 후속) */}
      <label className="flex h-9 max-w-[360px] flex-1 items-center gap-2 rounded-[10px] border border-transparent bg-surface-3 px-3 transition-colors focus-within:border-accent">
        <Search size={14} className="shrink-0 text-muted-2" aria-hidden="true" />
        <input
          type="search"
          placeholder="여행 검색"
          className="w-full bg-transparent text-[13.5px] text-text-2 outline-none placeholder:text-muted-2"
          aria-label="여행 검색"
        />
      </label>

      {/* 오른쪽: 테마 토글 + 아바타 */}
      <div className="ml-auto flex items-center gap-2.5">
        <button
          onClick={toggleThemeWithTransition}
          className="p-2 rounded-lg text-muted hover:bg-surface-hover transition-colors"
          aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        >
          {theme === 'light' ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
        </button>

        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt=""
            className="h-[30px] w-[30px] cursor-pointer rounded-full object-cover"
            role="button"
            tabIndex={0}
            aria-label="사용자 메뉴"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
            role="button"
            tabIndex={0}
            aria-label="사용자 메뉴"
          >
            {user?.nickname?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </header>
  );
}
