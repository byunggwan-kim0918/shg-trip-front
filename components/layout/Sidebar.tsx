'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, LogOut, PanelLeftClose, MapPin } from 'lucide-react';
import { useAppStore, useAuthStore } from '@/lib/stores';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import { forceLogout } from '@/lib/api/fetchClient';
import StatusDot from '@/components/common/StatusDot';
import { displayStatus, dateRange } from '@/lib/utils/tripStatus';

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const { itineraries, loadItineraries } = useItineraryStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

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
            ? 'w-[264px] translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0'
          }
        `}
        role="complementary"
        aria-label="사이드바"
      >
        {/* 헤더: 로고 + 접기 */}
        <div className="flex items-center justify-between h-14 px-4 shrink-0">
          <Link
            href="/main"
            aria-label="홈으로 이동"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[9px] text-sm font-extrabold text-white"
              style={{ background: 'linear-gradient(140deg, var(--accent), oklch(0.62 0.15 200))' }}
            >
              S
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-muted hover:bg-surface-hover transition-colors"
            aria-label="사이드바 접기"
          >
            <PanelLeftClose size={17} aria-hidden="true" />
          </button>
        </div>

        {/* 새 여행 버튼 → AI 새 여행 셸 (AI/직접 선택은 셸에서) */}
        <div className="px-3.5 mb-5">
          <button
            onClick={() => router.push('/main/plan/new')}
            className="flex w-full items-center gap-2 rounded-xl border border-card-border bg-surface-2 px-3.5 py-[11px] text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>새 여행 만들기</span>
          </button>
        </div>

        {/* 내 여행함 */}
        <nav className="flex-1 overflow-y-auto px-3.5" aria-label="내 여행함">
          <h2 className="px-1.5 pb-2.5 text-xs font-bold tracking-[0.04em] text-muted-2">
            내 여행함
          </h2>

          <div className="flex flex-col gap-0.5">
            {itineraries.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-5 py-6 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-muted-2">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <span className="text-[12.5px] leading-relaxed text-muted-2">
                  여기에 만든<br />여행이 쌓여요
                </span>
              </div>
            ) : (
              itineraries.map((item) => {
                const isActive = pathname === `/main/itinerary/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    href={`/main/itinerary/${item.id}`}
                    className={`flex items-center gap-2.5 rounded-[10px] px-2 py-[9px] transition-colors ${
                      isActive ? 'bg-surface-3' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <StatusDot status={displayStatus(item)} showLabel={false} size={8} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={`truncate text-[13.5px] font-semibold ${
                          isActive ? 'text-foreground' : 'text-text-2'
                        }`}
                      >
                        {item.title ?? item.destination}
                      </span>
                      <span className="truncate text-[11.5px] text-muted-2">
                        {item.destination} · {dateRange(item.startDate, item.endDate)}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </nav>

        {/* 사용자 프로필 */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 px-1.5">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt=""
                className="h-[30px] w-[30px] rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                aria-hidden="true"
              >
                {user?.nickname?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {user?.nickname ?? '사용자'}
              </p>
              <p className="truncate text-[11px] text-muted-2">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={forceLogout}
              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-surface-hover transition-colors shrink-0"
              aria-label="로그아웃"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
