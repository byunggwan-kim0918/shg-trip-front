'use client';

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleStartPlanning = () => {
    // TODO: 로그인 체크 로직 추가
    // 지금은 바로 로그인 페이지로
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-500 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              TripPlan
            </span>
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            <a 
              href="/auth/login" 
              className="px-3 sm:px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              로그인
            </a>
            <a 
              href="/auth/signup" 
              className="px-3 sm:px-4 py-1.5 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
            >
              회원가입
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12 sm:mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
              AI가 만드는
              <br />
              완벽한 여행 계획
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-3">
              여행지만 선택하면, AI가 최적의 일정을 추천해드립니다
            </p>
            <p className="text-lg sm:text-xl text-gray-500">
              동선, 시간, 예산까지 고려한 맞춤형 여행 계획
            </p>
          </div>

          {/* CTA Button */}
          <div>
            <button
              onClick={handleStartPlanning}
              className="group px-10 sm:px-14 py-5 sm:py-6 bg-teal-500 hover:bg-teal-600 text-white text-lg sm:text-xl font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-3">
                여행 계획 시작하기
                <svg className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
