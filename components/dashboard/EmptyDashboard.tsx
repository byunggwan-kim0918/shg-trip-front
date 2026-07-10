'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY, SENTENCE_PLACEHOLDER, EXAMPLE_CHIPS } from '@/lib/constants/newTrip';

/** 신규 유저 빈 상태 (7d/7e). 자연어 입력 + 예시 칩 + 직접 고르기. */
export default function EmptyDashboard() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');

  const start = (text?: string) => {
    const value = (text ?? sentence).trim();
    if (value) sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, value);
    router.push('/main/plan/new?builder=1');
  };

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-[22px] flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-accent-soft text-accent-weak-fg">
        <Zap size={34} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-foreground sm:text-[26px]">
        첫 여행을 시작해볼까요?
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted sm:text-[15px]">
        가고 싶은 곳을 한 문장으로 적으면
        <br />
        AI가 일정을 만들어드려요.
      </p>

      {/* 자연어 입력 */}
      <form
        onSubmit={(e) => { e.preventDefault(); start(); }}
        className="mt-7 flex w-full max-w-[560px] flex-col gap-3 rounded-2xl border-[1.5px] border-accent bg-card-bg p-4 shadow-[0_14px_34px_-18px_var(--accent)] sm:flex-row sm:items-center sm:gap-2.5 sm:py-2 sm:pl-5 sm:pr-2"
      >
        <input
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={SENTENCE_PLACEHOLDER}
          className="w-full flex-1 bg-transparent text-left text-[14.5px] text-foreground outline-none placeholder:text-muted-2 sm:text-[15px]"
          aria-label="여행 문장 입력"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-[13.5px] font-bold text-white transition-[filter] hover:brightness-105"
        >
          만들기 <ArrowRight size={14} aria-hidden="true" />
        </button>
      </form>

      {/* 예시 칩 + 직접 고르기 */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
        <div className="flex flex-wrap justify-center gap-[7px]">
          {EXAMPLE_CHIPS.slice(0, 3).map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => start(chip.sentence)}
              className="rounded-full bg-surface-3 px-3.5 py-2 text-[12.5px] font-semibold text-text-2 transition-colors hover:bg-accent-soft hover:text-accent-weak-fg"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <span className="hidden h-[18px] w-px bg-card-border sm:block" />
        <button
          type="button"
          onClick={() => router.push('/main/plan/new?builder=1')}
          className="rounded-full border border-card-border bg-card-bg px-4 py-2 text-[12.5px] font-bold text-text-2 transition-colors hover:bg-surface-hover"
        >
          직접 고를래요
        </button>
      </div>
    </div>
  );
}
