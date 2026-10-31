'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

/** 세션 확인 동안의 골격. 실제 Sidebar·Header는 목록·프로필을 불러오므로 인증 뒤에 마운트한다. */
function MainShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background" aria-busy="true" aria-label="불러오는 중">
      <aside className="hidden w-[264px] shrink-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar-bg px-3.5 md:flex">
        <div className="flex h-14 items-center gap-2.5 px-0.5">
          <div className="h-7 w-7 rounded-lg shg-shimmer" />
          <div className="h-3.5 w-20 rounded shg-shimmer" />
        </div>
        <div className="h-[46px] rounded-[10px] shg-shimmer" />
        <div className="flex flex-col gap-3 px-1">
          <div className="h-3 w-3/4 rounded shg-shimmer" />
          <div className="h-3 w-2/3 rounded shg-shimmer" />
          <div className="h-3 w-1/2 rounded shg-shimmer" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[60px] shrink-0 items-center border-b border-header-border bg-header-bg px-5">
          <div className="ml-auto h-8 w-8 rounded-full shg-shimmer" />
        </div>
        <div className="flex flex-col gap-4 px-4 py-5 md:px-7 md:py-6">
          <div className="h-6 w-48 rounded shg-shimmer" />
          <div className="h-40 rounded-xl shg-shimmer" />
          <div className="h-24 rounded-xl shg-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <AuthGuard fallback={<MainShellSkeleton />}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div
          className={`
            flex flex-col flex-1 min-w-0
            transition-[width] duration-200 ease-in-out
          `}
        >
          <Header />
          <main
            className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-6"
            role="main"
            aria-label="메인 콘텐츠"
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
