import SocialLoginGroup from '@/components/auth/SocialLoginGroup';

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      <div className="animate-fade-in-up mb-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">TripPlan</h1>
          <p className="mt-1.5 text-sm text-muted">간편하게 시작하세요</p>
        </div>
      </div>

      <div className="animate-fade-in-up animation-delay-100 w-full glass-card rounded-2xl p-6">
        <SocialLoginGroup />
      </div>

      <p className="animate-fade-in-up animation-delay-200 mt-8 text-[11px] text-muted/60 text-center leading-relaxed">
        시작하기를 누르면{' '}
        <a href="/terms" className="underline hover:text-muted transition-colors">이용약관</a>
        {' '}및{' '}
        <a href="/privacy" className="underline hover:text-muted transition-colors">개인정보처리방침</a>
        에 동의하게 됩니다.
      </p>
    </div>
  );
}
