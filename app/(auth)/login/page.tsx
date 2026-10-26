import { Suspense } from 'react';
import SocialLoginGroup from '@/components/auth/SocialLoginGroup';
import LoginErrorToast from '@/components/auth/LoginErrorToast';
import Logo from '@/components/common/Logo';

/**
 * 로그인 좌측 미리보기. 실제 생성 결과와 같은 모양(시간 · 장소)을 보여준다.
 * 랜딩 히어로와 같은 어휘를 쓰되 구성은 달리해서 두 화면이 복붙으로 읽히지 않게 한다.
 */
const LOGIN_PREVIEW = [
  { time: '10:30', name: '제주국제공항' },
  { time: '12:10', name: '동문재래시장' },
  { time: '14:00', name: '성산일출봉' },
] as const;


/** 진입 모션(design-dna.md §7). 대상에 따라 메커니즘을 나눈다.
 *  텍스트=아래서 위로 "도착" / 이미지=거의 제자리에서 "안착"(4px). 같은 효과를 전부에 복사하지 않는다. */
const ENTER_TEXT =
  'motion-safe:opacity-0 motion-safe:[animation:fade-in-up_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]';
const ENTER_MEDIA =
  'motion-safe:opacity-0 motion-safe:[animation:shg-fade-in_500ms_cubic-bezier(0.23,1,0.32,1)_forwards]';

export default function LoginPage() {
  return (
    <div className="w-full max-w-5xl">
      <Suspense fallback={null}>
        <LoginErrorToast />
      </Suspense>

      {/* 분할 인증: 좌 콜라주 / 우 카드. 모바일은 세로 스택(콜라주 위, 카드 아래). */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-14">
        {/* 좌: 입력 → 결과 데모.
            예전엔 목적지 타일 4개를 깔았는데, 이 제품에는 커버 사진이 없어서 늘 그라데이션
            폴백이었다. 네 타일이 같은 녹색 계열로 나와 "물감 색표본"이 됐고, 폴백을 종이 톤으로
            낮추자 이번엔 빈 흰 판이 됐다 — 타일 자체가 내용물인 자리라 폴백 조정으로는 안 된다.
            로그인 전 사용자가 알아야 하는 건 목적지가 아니라 **무엇을 넣으면 무엇이 나오는가**다. */}
        <div className={`${ENTER_MEDIA} md:max-w-[480px]`}>
          <p className="mb-3 text-[13px] font-semibold text-muted">이렇게 적으면</p>

          <div className="rounded-xl border border-card-border bg-card-bg p-5">
            <p className="text-[17px] font-semibold leading-[1.55] text-foreground">
              “7월 말에 제주로 2박 3일,<br />카페랑 오름 위주로 여유롭게”
            </p>
          </div>

          <div className="flex items-center gap-2 py-3 pl-5">
            <span className="h-5 w-px bg-card-border" aria-hidden="true" />
            <span className="text-xs font-semibold text-muted">AI가 동선 · 시간 · 예산 계산</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-card-border bg-card-bg">
            <div className="flex items-baseline gap-2.5 border-b border-divider px-5 py-3">
              <span className="text-sm font-extrabold tracking-[-0.02em] text-foreground">Day 1</span>
              <span className="text-xs font-medium text-muted tabular-nums">10.17 (토)</span>
              <span className="ml-auto text-xs font-medium text-muted tabular-nums">44.4km</span>
            </div>
            <ol className="flex flex-col gap-3 px-5 py-4">
              {LOGIN_PREVIEW.map((step, i) => (
                <li key={step.name} className="flex items-baseline gap-3">
                  <span className="w-[42px] shrink-0 text-[13px] font-bold text-accent-weak-fg tabular-nums">{step.time}</span>
                  <span className="truncate text-sm font-bold text-foreground">{step.name}</span>
                  {i === LOGIN_PREVIEW.length - 1 && (
                    <span className="ml-auto shrink-0 text-xs font-medium text-muted">외 2곳</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* 우: 로그인 카드. 좌측 정렬. */}
        <div className={`${ENTER_TEXT} motion-safe:[animation-delay:80ms] flex w-full max-w-[380px] flex-col items-start text-left`}>
          <Logo size={62} className="mb-5" />
          <h1 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</h1>
          <p className="mt-1.5 text-sm text-text-2">한 문장으로 시작하세요</p>

          <div className="mt-8 w-full">
            <SocialLoginGroup />
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-text-2">
            시작하면{' '}
            <a href="/terms" className="underline transition-colors hover:text-foreground">이용약관</a>
            {' '}및{' '}
            <a href="/privacy" className="underline transition-colors hover:text-foreground">개인정보처리방침</a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
