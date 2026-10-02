'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Route, Wallet, Share2, ArrowRight } from 'lucide-react';
import DestinationCover from '@/components/common/DestinationCover';
import Reveal from '@/components/common/Reveal';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/common/Logo';
import {
  NEW_TRIP_SENTENCE_KEY,
  SENTENCE_PLACEHOLDER,
  EXAMPLE_CHIPS,
} from '@/lib/constants/newTrip';

/**
 * 히어로 콜라주. 종횡비를 일부러 다르게 두어 대칭 그리드를 깬다.
 * imageUrl은 현재 시드 기반 플레이스홀더 사진. 장소 이미지 파이프라인이
 * 랜딩에 열리면 places.image_url로 교체하면 된다(DestinationCover가
 * 사진 우선 → 그라데이션 폴백을 이미 처리한다).
 */
/* 로그인 콜라주와 같은 구성 규칙(§ app/(auth)/login/page.tsx).
 * 2×2 그리드 + translate-y는 행 높이가 큰 타일에 맞춰지면서 우측 열이 아래로 흘러 잘렸다.
 * 두 세로 열에 [높은 것 + 낮은 것]을 반대 순서로 넣으면 열 높이 합이 같아져 아래가 맞는다. */
const HERO_COLUMN_A = [
  { destination: '제주', ratio: 'aspect-[3/4]' },
  { destination: '경주', ratio: 'aspect-square' },
];
const HERO_COLUMN_B = [
  { destination: '부산', ratio: 'aspect-square' },
  { destination: '도쿄', ratio: 'aspect-[3/4]' },
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
    <div className="min-h-[100dvh] bg-surface">
      {/* nav: 단일 행, 높이 66px */}
      <header className="sticky top-0 z-50 border-b border-divider bg-header-bg backdrop-blur-xl">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center justify-between px-5 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-[15px] font-extrabold tracking-[-0.02em] text-foreground">SHG trip</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="#features"
              className="hidden text-sm font-semibold text-text-2 transition-colors hover:text-foreground sm:block"
            >
              기능
            </a>
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl border border-card-border px-4 py-2 text-[13px] font-bold text-foreground transition-colors hover:bg-surface-hover"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="px-5 sm:px-10">
        {/* ── 히어로: 비대칭 분할 (좌 카피/입력, 우 콜라주) ── */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 pb-20 pt-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:gap-14 md:pt-20">
          {/* 좌: 좌측 정렬 */}
          <div className="motion-safe:opacity-0 motion-safe:[animation:fade-in-up_400ms_cubic-bezier(0.23,1,0.32,1)_forwards] text-left">
            <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[52px]">
              말 한마디면,
              <br />
              여행이 완성됩니다
            </h1>

            <p className="mt-5 max-w-[46ch] text-[15px] font-medium leading-relaxed text-muted sm:text-[17px]">
              가고 싶은 곳을 문장으로 적어보세요. AI가 동선, 시간, 예산까지 한 번에 짜드려요.
            </p>

            {/* 자연어 입력창 = 주 CTA */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTrip();
              }}
              className="mt-8 flex w-full max-w-[560px] flex-col gap-3 rounded-2xl border-[1.5px] border-accent bg-card-bg p-4 shadow-[0_14px_34px_-18px_rgba(20,22,28,0.45)] sm:flex-row sm:items-center sm:gap-2.5 sm:py-2 sm:pl-5 sm:pr-2"
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
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-fg transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
              >
                만들기 <ArrowRight size={14} aria-hidden="true" />
              </button>
            </form>

            {/* 예시 칩: 입력창 프리필 */}
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

          {/* 우: 종횡비가 다른 목적지 콜라주 */}
          <div className="motion-safe:opacity-0 motion-safe:[animation:shg-fade-in_500ms_cubic-bezier(0.23,1,0.32,1)_forwards] motion-safe:[animation-delay:80ms] grid grid-cols-2 items-start gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {HERO_COLUMN_A.map((tile, i) => (
                <DestinationCover
                  key={tile.destination}
                  destination={tile.destination}
                  seedOffset={i * 7}
                  rich
                  labelSize={26}
                  className={`${tile.ratio} rounded-2xl`}
                />
              ))}
            </div>
            {/* 우측 열만 살짝 내려 리듬을 준다. 열 높이가 같으므로 이 값만큼만 어긋난다 */}
            <div className="mt-6 flex flex-col gap-3 sm:gap-4">
              {HERO_COLUMN_B.map((tile, i) => (
                <DestinationCover
                  key={tile.destination}
                  destination={tile.destination}
                  seedOffset={(i + 2) * 7}
                  rich
                  labelSize={26}
                  className={`${tile.ratio} rounded-2xl`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── 기능: 비대칭 벤토 3셀 (동일 3분할 금지) ── */}
        {/* JS 미동작 시 reveal 요소가 opacity:0으로 남지 않도록 */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important}`}</style>
        </noscript>
        <section id="features" className="mx-auto max-w-6xl pb-24">
          <h2 className="mb-8 text-[23px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[30px]">
            AI가 대신 하는 것들
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* 대형 셀: 시각 요소 포함 */}
            <Reveal className="md:col-span-3">
              <article className="relative h-full overflow-hidden rounded-2xl border border-divider bg-surface-2">
              <DestinationCover
                destination="제주"
                showLabel={false}
                seedOffset={3}
                className="h-[190px] w-full sm:h-[230px]"
              />
              <div className="p-6">
                <span className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-accent-soft text-accent-weak-fg">
                  <Route size={18} aria-hidden="true" />
                </span>
                <h3 className="mb-1.5 text-[17px] font-bold text-foreground">스마트 동선</h3>
                <p className="max-w-[42ch] text-[13px] leading-[1.6] text-muted">
                  거리와 이동 시간을 계산해 하루 일정을 최적 순서로 자동 배치합니다.
                </p>
              </div>
              </article>
            </Reveal>

            {/* 소형 셀: 틴트 배경 */}
            <Reveal delay={50} className="md:col-span-2">
              {/* 옆 셀 높이에 맞춰 늘어나는 칸이라 justify-end면 내용이 바닥에 붙고 위쪽 틴트가
                  290px 빈 판으로 남는다(로드 실패처럼 보인다). 광학 중앙에 둔다. */}
              <article className="flex h-full flex-col justify-center rounded-2xl border border-divider bg-accent-soft p-6">
              <span className="mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-surface text-accent-weak-fg">
                <Wallet size={18} aria-hidden="true" />
              </span>
              <h3 className="mb-1.5 text-[17px] font-bold text-foreground">예산 관리</h3>
              <p className="text-[13px] leading-[1.6] text-text-2">
                항목별 예상 비용을 한눈에 정리해 총액을 미리 알려줍니다.
              </p>
              </article>
            </Reveal>

            {/* 와이드 셀: 가로 구성으로 리듬 전환 */}
            <Reveal delay={100} className="md:col-span-5">
              <article className="flex flex-col items-start gap-5 rounded-2xl border border-divider bg-surface-2 p-6 sm:flex-row sm:items-center sm:gap-7">
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-weak-fg">
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
        <p className="text-xs text-muted-2">&copy; 2026 SHG trip</p>
      </footer>
    </div>
  );
}
