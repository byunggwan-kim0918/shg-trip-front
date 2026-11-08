'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Route, Wallet, Share2, ArrowRight } from 'lucide-react';
import Reveal from '@/components/common/Reveal';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/common/Logo';
import WithdrawnNotice from '@/components/auth/WithdrawnNotice';
import {
  NEW_TRIP_SENTENCE_KEY,
  SENTENCE_PLACEHOLDER,
  EXAMPLE_CHIPS,
} from '@/lib/constants/newTrip';

/** 유채색 예산(3개)을 넘기지 않게 같은 올리브 계열을 명도로만 나눈다. */
const BUDGET_SPLIT = [
  { label: '숙소', amount: '140,000원', pct: '52.6%', tone: 'var(--accent)' },
  { label: '식비', amount: '92,000원', pct: '34.6%', tone: 'color-mix(in oklab, var(--accent) 55%, transparent)' },
  { label: '교통', amount: '34,000원', pct: '12.8%', tone: 'color-mix(in oklab, var(--accent) 28%, transparent)' },
] as const;

const ROUTE_STRIP = [
  { name: '공항', km: '' },
  { name: '동문시장', km: '7.4km' },
  { name: '성산일출봉', km: '11.2km' },
  { name: '서연의집', km: '4.1km' },
] as const;

const HERO_PREVIEW_STEPS = [
  { time: '10:30', name: '제주국제공항', transit: '차로 18분 · 7.4km' },
  { time: '12:10', name: '동문재래시장', transit: '차로 24분 · 11.2km' },
  { time: '14:00', name: '성산일출봉', transit: '차로 12분 · 4.1km' },
  { time: '16:40', name: '카페 서연의집', transit: null },
] as const;


export default function Home() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');

  /** 비로그인이면 middleware가 /login으로 보내므로 문장은 sessionStorage에 먼저 남긴다. */
  const startTrip = () => {
    if (sentence.trim()) {
      sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, sentence.trim());
    }
    router.push('/main/plan/new?builder=1');
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-50 border-b border-divider bg-header-bg backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center justify-between px-5 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-[10px] border border-card-border px-4 py-2 text-[13px] font-bold text-foreground transition-colors hover:bg-surface-hover"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <WithdrawnNotice />
      </Suspense>

      <main className="px-5 sm:px-10">
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 pb-20 pt-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:gap-14 md:pt-20">
          <div className="motion-safe:opacity-0 motion-safe:[animation:fade-in-up_400ms_cubic-bezier(0.23,1,0.32,1)_forwards] text-left">
            <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[52px]">
              말 한마디면,
              <br />
              여행이 완성됩니다
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] font-medium leading-relaxed text-muted sm:text-[17px]">
              가고 싶은 곳을 문장으로 적어보세요. 동선, 시간, 예산까지 한 번에 짜드려요.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTrip();
              }}
              className="mt-8 flex w-full max-w-[560px] flex-col gap-3 rounded-xl border-[1.5px] border-accent bg-card-bg p-4 focus-within:ring-2 focus-within:ring-accent/25 shadow-[0_14px_34px_-18px_rgba(20,22,28,0.45)] sm:flex-row sm:items-center sm:gap-2.5 sm:py-2 sm:pl-5 sm:pr-2"
            >
              <Sparkles size={16} className="hidden shrink-0 text-accent-weak-fg sm:block" aria-hidden="true" />
              <input
                type="text"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder={SENTENCE_PLACEHOLDER}
                className="w-full flex-1 bg-transparent text-left text-[15px] text-foreground outline-none placeholder:text-muted-2 sm:text-[15px]"
                aria-label="여행 문장 입력"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-accent-fg transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
              >
                만들기 <ArrowRight size={14} aria-hidden="true" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSentence(chip.sentence)}
                  className="rounded-full bg-surface-3 px-3.5 py-2 text-[13px] font-semibold text-text-2 transition-colors hover:bg-accent-soft hover:text-accent-weak-fg"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* 커버 사진이 없어 목적지 타일은 빈 색면이 되므로, 실제 결과물(시간 · 장소 · 동선)을 보여준다. */}
          <div className="motion-safe:opacity-0 motion-safe:[animation:shg-fade-in_500ms_cubic-bezier(0.23,1,0.32,1)_forwards] motion-safe:[animation-delay:80ms]">
            <div className="overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-[0_24px_60px_-40px_rgba(20,22,28,0.45)]">
              <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3.5">
                <span className="text-[13px] font-bold text-foreground">
                  제주 <span className="font-medium text-muted">· 2박 3일</span>
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-weak-fg">
                  한 문장으로 짠 일정
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 px-5 pb-1 pt-4">
                <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">Day 1</span>
                <span className="text-xs font-medium text-muted tabular-nums">10.17 (토)</span>
                <span className="ml-auto text-xs font-medium text-muted tabular-nums">총 이동 44.4km</span>
              </div>

              <ol className="px-5 pb-5 pt-2">
                {HERO_PREVIEW_STEPS.map((step, i) => (
                  <li key={step.name} className="relative flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg tabular-nums">
                        {i + 1}
                      </span>
                      {i < HERO_PREVIEW_STEPS.length - 1 && (
                        <span className="w-px flex-1 bg-divider" aria-hidden="true" />
                      )}
                    </div>
                    <div className={i < HERO_PREVIEW_STEPS.length - 1 ? 'min-w-0 flex-1 pb-4' : 'min-w-0 flex-1'}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-bold text-accent-weak-fg tabular-nums">{step.time}</span>
                        <span className="truncate text-sm font-bold text-foreground">{step.name}</span>
                      </div>
                      {step.transit && (
                        <span className="mt-1 block text-xs font-medium text-muted tabular-nums">{step.transit}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* JS가 꺼져 있으면 reveal 요소가 opacity:0으로 남는다 */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important}`}</style>
        </noscript>
        <section id="features" className="mx-auto max-w-6xl pb-24">
          <h2 className="mb-8 text-[23px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[30px]">
            이런 걸 알아서 챙겨요
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* 커버 이미지는 내용 없는 색 판이 되므로 이 셀이 설명하는 거리·순서를 직접 그린다. */}
            <Reveal className="md:col-span-3">
              <article className="flex h-full flex-col justify-between gap-7 rounded-xl border border-divider bg-surface-2 p-6">
              <div>
                <span className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-accent-soft text-accent-weak-fg">
                  <Route size={18} aria-hidden="true" />
                </span>
                <h3 className="mb-1.5 text-[17px] font-bold text-foreground">스마트 동선</h3>
                <p className="max-w-[42ch] text-[13px] leading-[1.6] text-muted">
                  거리와 이동 시간을 계산해 하루 일정을 최적 순서로 자동 배치합니다.
                </p>
              </div>
              <ol className="flex items-start" aria-label="동선 예시">
                {ROUTE_STRIP.map((stop, i) => (
                  <li
                    key={stop.name}
                    className={i === 0 ? 'flex min-w-0 shrink-0 flex-col gap-2' : 'flex min-w-0 flex-1 flex-col gap-2'}
                  >
                    <div className="flex items-center gap-1.5">
                      {i > 0 && (
                        <>
                          <span className="h-px flex-1 bg-card-border" aria-hidden="true" />
                          <span className="shrink-0 text-[11px] font-semibold text-muted-2 tabular-nums">{stop.km}</span>
                          <span className="h-px flex-1 bg-card-border" aria-hidden="true" />
                        </>
                      )}
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    </div>
                    <span className="truncate text-[11px] font-semibold text-text-2" style={{ marginLeft: i === 0 ? 0 : 'auto', marginRight: i === 0 ? 'auto' : 0 }}>
                      {stop.name}
                    </span>
                  </li>
                ))}
              </ol>
              </article>
            </Reveal>

            <Reveal delay={50} className="md:col-span-2">
              {/* 옆 셀 높이로 늘어나는 칸이라 justify-end면 위쪽이 빈 판으로 남아 로드 실패처럼 보인다. */}
              <article className="flex h-full flex-col justify-center rounded-xl border border-divider bg-accent-soft p-6">
              <span className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-surface text-accent-weak-fg">
                <Wallet size={18} aria-hidden="true" />
              </span>
              <h3 className="mb-1.5 text-[17px] font-bold text-foreground">예산 관리</h3>
              <p className="mb-6 text-[13px] leading-[1.6] text-text-2">
                항목별 예상 비용을 한눈에 정리해 총액을 미리 알려줍니다.
              </p>
              <div className="flex h-2 overflow-hidden rounded-full" aria-hidden="true">
                {BUDGET_SPLIT.map((b) => (
                  <span key={b.label} className="h-full" style={{ width: b.pct, background: b.tone }} />
                ))}
              </div>
              <dl className="mt-3.5 flex flex-col gap-1.5">
                {BUDGET_SPLIT.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.tone }} aria-hidden="true" />
                    <dt className="font-semibold text-text-2">{b.label}</dt>
                    <dd className="ml-auto font-bold text-foreground tabular-nums">{b.amount}</dd>
                  </div>
                ))}
                <div className="mt-1.5 flex items-center gap-2 border-t border-accent-weak-fg/20 pt-2 text-xs">
                  <dt className="font-bold text-foreground">합계</dt>
                  <dd className="ml-auto font-extrabold text-accent-weak-fg tabular-nums">266,000원</dd>
                </div>
              </dl>
              </article>
            </Reveal>

            <Reveal delay={100} className="md:col-span-5">
              <article className="flex flex-col items-start gap-5 rounded-xl border border-divider bg-surface-2 p-6 sm:flex-row sm:items-center sm:gap-7">
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-weak-fg">
                <Share2 size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="mb-1.5 text-[17px] font-bold text-foreground">링크 공유</h3>
                <p className="max-w-[62ch] text-[13px] leading-[1.6] text-muted">
                  링크 하나로 일행을 초대해 같은 일정을 함께 보고 편집합니다.
                </p>
              </div>
              </article>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-divider py-8 text-center">
        <nav className="mb-2 flex justify-center gap-4 text-xs text-text-2">
          <Link href="/terms" className="transition-colors hover:text-foreground">이용약관</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">개인정보처리방침</Link>
        </nav>
        <p className="text-xs text-muted-2">&copy; 2026 SHG trip</p>
      </footer>
    </div>
  );
}
