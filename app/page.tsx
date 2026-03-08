'use client';

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              TripPlan
            </span>
          </div>

          <a
            href="/login"
            className="px-5 py-2 text-sm font-semibold text-teal-600 hover:text-white hover:bg-teal-500 border border-teal-200 hover:border-teal-500 rounded-full transition-all duration-300"
          >
            로그인
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 pt-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-teal-700">AI 기반 여행 플래너</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.15] tracking-tight">
            여행 계획,
            <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">
              AI가 대신 세워드립니다
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-xl mx-auto leading-relaxed">
            여행지만 선택하면 동선, 시간, 예산까지
            <br className="hidden sm:block" />
            고려한 최적의 일정을 만들어드려요
          </p>

          {/* CTA */}
          <button
            onClick={() => router.push("/login")}
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold rounded-full transition-all duration-300 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/25 hover:-translate-y-0.5 cursor-pointer"
          >
            여행 시작하기
            <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">빠른 일정 생성</h3>
              <p className="text-sm text-gray-500 leading-relaxed">몇 번의 클릭만으로 최적의 여행 일정을 자동 생성</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">스마트 동선</h3>
              <p className="text-sm text-gray-500 leading-relaxed">거리와 이동 시간을 고려한 효율적인 동선 추천</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">함께 계획하기</h3>
              <p className="text-sm text-gray-500 leading-relaxed">친구, 가족과 실시간으로 여행 계획을 공유</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-gray-300">&copy; 2026 TripPlan</p>
      </footer>
    </div>
  );
}
