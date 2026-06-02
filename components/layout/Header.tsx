'use client';

import Link from 'next/link';
import { useAppStore, useAuthStore } from '@/lib/stores';

export default function Header() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-header-bg backdrop-blur-xl"
      role="banner"
    >
      {/* 왼쪽 */}
      <div className="flex items-center gap-3">
        {/* 사이드바 닫혀있을 때: 로고 + 사이드바 열기 버튼 표시 */}
        {!sidebarOpen && (
          <>
            <Link href="/main" aria-label="홈으로 이동" className="w-7 h-7 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-muted hover:bg-surface-hover transition-colors"
              aria-label="사이드바 열기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="1.5" y="1.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <line x1="6.5" y1="1.5" x2="6.5" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </>
        )}

        {/* 텍스트 */}
        <span className="text-base font-semibold text-foreground">SHG trip</span>
      </div>

      {/* 오른쪽: 테마 토글 + 사용자 아바타 */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-muted hover:bg-surface-hover transition-colors"
          aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
        >
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2V3M10 17V18M18 10H17M3 10H2M15.66 15.66L14.95 14.95M5.05 5.05L4.34 4.34M15.66 4.34L14.95 5.05M5.05 14.95L4.34 15.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.003 8.003 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt=""
            className="w-7 h-7 rounded-full object-cover cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="사용자 메뉴"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium cursor-pointer"
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
