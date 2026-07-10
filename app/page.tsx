'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Route, Wallet, Share2, ArrowRight } from 'lucide-react';
import {
  NEW_TRIP_SENTENCE_KEY,
  SENTENCE_PLACEHOLDER,
  EXAMPLE_CHIPS,
} from '@/lib/constants/newTrip';

const FEATURES = [
  {
    icon: Route,
    title: '스마트 동선',
    description: '거리·시간을 계산해 최적 순서로 자동 배치',
  },
  {
    icon: Wallet,
    title: '예산 관리',
    description: '항목별 예상 비용을 한눈에 정리',
  },
  {
    icon: Share2,
    title: '링크 공유',
    description: '링크 하나로 일행과 함께 편집',
  },
];

export default function Home() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');

  /** 문장 저장 후 새 여행 마법사로. 비로그인 시 middleware가 /login으로 보낸다. */
  const startTrip = () => {
    if (sentence.trim()) {
      sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, sentence.trim());
    }
    router.push('/main/plan/new?builder=1');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* nav */}
      <header className="sticky top-0 z-50 border-b border-divider bg-header-bg backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-5xl items-center justify-between px-5 sm:px-10">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[9px] text-sm font-extrabold text-white"
              style={{ background: 'linear-gradient(140deg, var(--accent), oklch(0.62 0.15 200))' }}
            >
              S
            </span>
            <span className="text-base font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-[22px]">
            <a href="#features" className="hidden text-sm font-semibold text-text-2 transition-colors hover:text-foreground sm:block">
              기능
            </a>
            <Link
              href="/login"
              className="rounded-[10px] border border-card-border px-4 py-2 text-[13.5px] font-bold text-foreground transition-colors hover:bg-surface-hover"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="px-5 pb-16 pt-14 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {/* 배지 pill */}
          <span className="mb-6 inline-flex items-center gap-[7px] rounded-full bg-accent-soft px-3.5 py-1.5 text-[13px] font-bold text-accent-weak-fg">
            <span className="h-[7px] w-[7px] rounded-full bg-accent" />
            AI 여행 플래너
          </span>

          {/* H1 — 그라데이션 텍스트 금지, 단색 */}
          <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[52px]">
            말 한마디면,
            <br />
            여행이 완성됩니다
          </h1>

          <p className="mt-5 max-w-[520px] text-[15px] font-medium leading-relaxed text-muted sm:text-[17px]">
            가고 싶은 곳을 문장으로 적어보세요.
            <br />
            AI가 동선 · 시간 · 예산까지 한 번에 짜드려요.
          </p>

          {/* 자연어 입력창 — 주 CTA */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTrip();
            }}
            className="mt-[34px] flex w-full max-w-[640px] flex-col gap-3 rounded-2xl border-[1.5px] border-accent bg-card-bg p-4 shadow-[0_14px_34px_-16px_var(--accent)] sm:flex-row sm:items-center sm:gap-2.5 sm:py-2 sm:pl-5 sm:pr-2"
          >
            <Sparkles size={16} className="hidden shrink-0 text-accent sm:block" aria-hidden="true" />
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder={SENTENCE_PLACEHOLDER}
              className="w-full flex-1 bg-transparent text-left text-[14.5px] text-foreground outline-none placeholder:text-muted-2 sm:text-[15.5px]"
              aria-label="여행 문장 입력"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition-[filter] hover:brightness-105"
            >
              만들기 <ArrowRight size={14} aria-hidden="true" />
            </button>
          </form>

          {/* 예시 칩 */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
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

          {/* 기능 bento 3개 */}
          <div id="features" className="mt-12 grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-divider bg-surface-2 p-[22px] text-left"
              >
                <span className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent-soft text-accent-weak-fg">
                  <f.icon size={18} aria-hidden="true" />
                </span>
                <div className="mb-1.5 text-[15px] font-bold text-foreground">{f.title}</div>
                <div className="text-[13px] leading-[1.55] text-muted">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs text-muted-2">&copy; 2026 SHG trip</p>
      </footer>
    </div>
  );
}
