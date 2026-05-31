'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div
          className={`
            flex flex-col flex-1 min-w-0
            transition-all duration-200 ease-in-out
          `}
        >
          <Header />
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6"
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
