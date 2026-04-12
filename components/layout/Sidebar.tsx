'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, useAuthStore } from '@/lib/stores';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { forceLogout } from '@/lib/api/fetchClient';

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const { itineraries, loadItineraries } = useItineraryStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    }
    if (showModeMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModeMenu]);

  const navigateNewTrip = (mode: 'auto' | 'manual') => {
    setShowModeMenu(false);
    router.push(`/main/plan/new?mode=${mode}`);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full
          flex flex-col
          bg-sidebar-bg border-r border-sidebar-border
          transition-all duration-200 ease-in-out
          md:relative md:z-auto
          ${sidebarOpen
            ? 'w-[260px] translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0'
          }
        `}
        role="complementary"
        aria-label="사이드바"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between h-14 px-4 shrink-0">
          <Link href="/main" aria-label="홈으로 이동" className="w-7 h-7 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-muted hover:bg-surface-hover transition-colors"
            aria-label="사이드바 접기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="1.5" y="1.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6.5" y1="1.5" x2="6.5" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* 새 일정 버튼 + 모드 선택 드롭다운 */}
        <div className="px-3 mb-2 relative" ref={menuRef}>
          <button
            onClick={() => setShowModeMenu((v) => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>새 일정</span>
          </button>

          {showModeMenu && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-card-bg border border-card-border rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => navigateNewTrip('auto')}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors"
              >
                <p className="text-sm font-medium text-foreground">🤖 AI 추천</p>
                <p className="text-xs text-muted mt-0.5">AI가 장소 선택부터 동선까지 완성</p>
              </button>
              <div className="border-t border-card-border" />
              <button
                onClick={() => navigateNewTrip('manual')}
                className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors"
              >
                <p className="text-sm font-medium text-foreground">✋ AI 맞춤 설계</p>
                <p className="text-xs text-muted mt-0.5">장소를 고르면 AI가 동선을 짜줌</p>
              </button>
            </div>
          )}
        </div>

        {/* 내 일정함 섹션 */}
        <nav className="flex-1 overflow-y-auto px-3" aria-label="내 일정함">
          <h2 className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-3">
            내 일정함
          </h2>

          <div className="space-y-1">
            {itineraries.length === 0 ? (
              <p className="text-sm text-muted/50 px-2 py-6 text-center">
                저장된 일정이 없습니다
              </p>
            ) : (
              itineraries.map((item) => {
                const isActive = pathname === `/main/itinerary/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    href={`/main/itinerary/${item.id}`}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">📍</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{item.title ?? item.destination}</p>
                      <p className="text-[11px] text-muted truncate">
                        {item.destination} · {new Date(item.startDate).getMonth() + 1}/{new Date(item.startDate).getDate()}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </nav>

        {/* 사용자 프로필 */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0"
              aria-hidden="true"
            >
              {user?.nickname?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.nickname ?? '사용자'}
              </p>
              <p className="text-[11px] text-muted truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={forceLogout}
              className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-surface-hover transition-colors shrink-0"
              aria-label="로그아웃"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
