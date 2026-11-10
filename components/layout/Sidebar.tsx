'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, PanelLeftClose, MapPin } from 'lucide-react';
import { normalizeText } from '@/lib/utils/text';
import { useAppStore } from '@/lib/stores';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import StatusDot from '@/components/common/StatusDot';
import Logo from '@/components/common/Logo';
import { displayStatus, dateRange } from '@/lib/utils/tripStatus';

export default function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { itineraries, listStatus, loadItineraries } = useItineraryStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void loadItineraries();
  }, [loadItineraries]);

  // 스토어 기본값(sidebarOpen: true)은 데스크톱 기준이라 모바일에서 드로어가 열린 채 시작해
  // 콘텐츠를 덮는다. 첫 마운트 때 뷰포트를 보고 모바일이면 닫는다.
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false);
  }, [setSidebarOpen]);

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
          transition-[width,transform] duration-200 ease-in-out
          md:relative md:z-auto
          ${sidebarOpen
            ? 'w-[264px] translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0'
          }
        `}
        role="complementary"
        aria-label="사이드바"
      >
        <div className="flex items-center justify-between h-14 px-4 shrink-0">
          <Link
            href="/main"
            aria-label="홈으로 이동"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Logo size={28} />
            <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-hover transition-colors"
            aria-label="사이드바 접기"
          >
            <PanelLeftClose size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="px-3.5 mb-5">
          <button
            onClick={() => router.push('/main/plan/new')}
            className="flex w-full items-center gap-2 rounded-[10px] border border-card-border bg-surface-2 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent-weak-fg"
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            <span>새 여행</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 pb-4" aria-label="내 여행함">
          <h2 className="px-1.5 pb-2.5 text-xs font-bold tracking-[0.04em] text-muted-2">
            내 여행함
          </h2>

          <div className="flex flex-col gap-0.5">
            {listStatus === 'error' ? (
              <p className="px-2.5 py-2 text-xs leading-relaxed text-muted">
                목록을 불러오지 못했어요.{' '}
                <button
                  type="button"
                  onClick={() => void loadItineraries()}
                  className="font-semibold text-foreground underline underline-offset-4 pointer-coarse:min-h-11"
                >
                  다시 시도
                </button>
              </p>
            ) : listStatus !== 'success' ? (
              <div className="flex flex-col gap-4 px-2.5 py-2" aria-busy="true" aria-label="여행 목록을 불러오는 중">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-3.5 w-4/5 rounded shg-shimmer" />
                    <div className="h-3 w-1/2 rounded shg-shimmer" />
                  </div>
                ))}
              </div>
            ) : itineraries.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-5 py-6 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3 text-muted-2">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <span className="text-xs leading-relaxed text-muted-2">
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
                    className={`flex items-center gap-2.5 rounded-[10px] px-2 py-2 transition-colors ${
                      isActive ? 'bg-surface-3' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <StatusDot status={displayStatus(item)} showLabel={false} size={8} />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={`truncate text-[13px] font-semibold ${
                          isActive ? 'text-foreground' : 'text-text-2'
                        }`}
                      >
                        {normalizeText(item.title) || item.destination}
                      </span>
                      <span className="truncate text-xs text-muted-2">
                        {item.destination} · {dateRange(item.startDate, item.endDate)}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
