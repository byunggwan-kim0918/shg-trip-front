'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-foreground">SHG trip</span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-muted hover:text-foreground border border-sidebar-border hover:border-foreground/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
            </svg>
            로그인
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-8 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-soft rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              <span className="text-xs font-medium text-muted">AI 기반 여행 플래너</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
              여행 계획,
              <br />
              <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
                AI가 대신 세워드립니다
              </span>
            </h1>

            <p className="text-base text-muted mb-10 max-w-md mx-auto leading-relaxed">
              여행지만 선택하면 동선, 시간, 예산까지
              <br className="hidden sm:block" />
              고려한 최적의 일정을 만들어드려요
            </p>

            <button
              onClick={() => router.push('/login')}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              여행 시작하기
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl border border-sidebar-border bg-card-bg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">AI가 만드는 완벽한 일정</h3>
              <p className="text-sm text-muted leading-relaxed">
                목적지와 날짜만 입력하면 AI가 동선, 시간, 테마를 고려해 최적의 여행 일정을 자동으로 생성합니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-sidebar-border bg-card-bg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">스마트 동선</h3>
              <p className="text-sm text-muted leading-relaxed">거리와 이동 시간을 고려한 효율적인 동선을 자동으로 계산합니다.</p>
            </div>

            <div className="p-6 rounded-2xl border border-sidebar-border bg-card-bg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">자유로운 커스텀</h3>
              <p className="text-sm text-muted leading-relaxed">드래그로 순서 변경, 각 단계마다 대안을 선택할 수 있습니다.</p>
            </div>

            <div className="p-6 rounded-2xl border border-sidebar-border bg-card-bg hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">링크 하나로 공유</h3>
              <p className="text-sm text-muted leading-relaxed">완성된 일정을 링크 하나로 친구, 가족과 공유하세요.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-muted/50">&copy; 2026 SHG trip</p>
      </footer>
    </div>
  );
}
