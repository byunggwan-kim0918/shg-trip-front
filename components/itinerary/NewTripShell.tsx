'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY, SENTENCE_PLACEHOLDER } from '@/lib/constants/newTrip';

/** 예산 퀵칩: 라벨 + 문장에 덧붙일 구절. */
const BUDGET_CHIPS: Array<{ label: string; phrase: string }> = [
  { label: '50만원', phrase: '예산은 50만원' },
  { label: '100만원', phrase: '예산은 100만원' },
  { label: '상관없음', phrase: '예산은 상관없음' },
];

/** 우측 "AI가 이렇게 이해했어요" 패널 필드 (Layer A: 실시간 파싱 전 placeholder). */
const UNDERSTAND_FIELDS = ['여행지', '기간', '인원', '테마', '페이스'] as const;

/**
 * AI 새 여행 셸 (리디자인 2c/3c).
 * Layer A: 문장은 sessionStorage로 wizard의 description에 프리필된다.
 * 실시간 LLM 파싱("이해했어요" 패널 갱신)은 Layer B(/parse 엔드포인트)에서 연결.
 */
export default function NewTripShell() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');
  const [budgetChip, setBudgetChip] = useState<string | null>(null);

  const applyBudgetChip = (chip: (typeof BUDGET_CHIPS)[number]) => {
    setBudgetChip(chip.label);
    setSentence((prev) => {
      // 기존 예산 구절 제거 후 새 구절 덧붙임
      const stripped = prev
        .replace(/,?\s*예산은 (50만원|100만원|상관없음)/g, '')
        .trimEnd();
      if (!stripped) return chip.phrase;
      return `${stripped}, ${chip.phrase}`;
    });
  };

  // 자동/수동 모드 분리 폐지 — 둘 다 5단계 마법사로. withSentence면 문장을 description 프리필.
  const goWizard = (withSentence: boolean) => {
    if (withSentence && sentence.trim()) {
      sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, sentence.trim());
    }
    router.replace('/main/plan/new?builder=1');
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-6 lg:flex-row lg:gap-9 lg:py-10">
      {/* 좌: 입력 */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 text-[13px] font-semibold text-muted-2">새 여행</div>
        <h2 className="mb-[22px] text-[30px] font-extrabold tracking-[-0.02em] text-foreground">
          어떤 여행을 꿈꾸세요?
        </h2>

        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={SENTENCE_PLACEHOLDER}
          autoFocus
          rows={4}
          className="min-h-[150px] w-full resize-none rounded-[18px] border-[1.5px] border-accent bg-card-bg p-[22px] text-[17px] leading-[1.7] text-foreground shadow-[0_14px_34px_-20px_var(--accent)] outline-none placeholder:text-muted-2"
          aria-label="여행 문장 입력"
        />

        {/* 예산 넛지 */}
        <div className="mt-3.5 flex flex-col gap-3 rounded-[14px] border border-warn-border bg-warn-bg px-[18px] py-4 sm:flex-row sm:items-center sm:gap-3.5">
          <span className="text-[13.5px] font-semibold text-warn-fg">
            예산도 알려주시면 더 정확해요 →
          </span>
          <div className="flex gap-[7px] sm:ml-auto">
            {BUDGET_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => applyBudgetChip(chip)}
                className={`rounded-full border px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                  budgetChip === chip.label
                    ? 'border-warn-fg bg-warn-fg text-white'
                    : 'border-warn-border bg-card-bg text-warn-fg hover:border-warn-fg'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-[26px] flex gap-3">
          <button
            type="button"
            onClick={() => goWizard(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-accent px-4 py-[15px] text-[15.5px] font-bold text-white shadow-[0_10px_24px_-10px_var(--accent)] transition-[filter] hover:brightness-105"
          >
            <Sparkles size={16} aria-hidden="true" /> AI로 일정 만들기
          </button>
          <button
            type="button"
            onClick={() => goWizard(false)}
            className="rounded-[14px] border border-card-border bg-card-bg px-[22px] py-[15px] text-[15px] font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            직접 고를래요
          </button>
        </div>
      </div>

      {/* 우: AI 이해 요약 패널 */}
      <aside className="w-full shrink-0 self-start rounded-[18px] border border-divider bg-card-bg p-6 lg:w-[400px]">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={15} className="text-accent" aria-hidden="true" />
          <span className="text-[15px] font-bold text-foreground">AI가 이렇게 이해했어요</span>
        </div>
        <div className="mb-[18px] text-[12.5px] text-muted-2">
          문장을 쓰면 자동으로 인식해요. 다음 단계에서 확인·수정할 수 있어요.
        </div>

        <div className="flex flex-col gap-0.5">
          {UNDERSTAND_FIELDS.map((field, i) => (
            <div
              key={field}
              className={`flex items-center justify-between py-[13px] ${
                i < UNDERSTAND_FIELDS.length - 1 ? 'border-b border-divider' : ''
              }`}
            >
              <span className="text-[13px] font-semibold text-muted-2">{field}</span>
              <span className="text-[14.5px] font-bold text-muted-2">—</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-surface-3 px-[15px] py-[13px] text-[12.5px] leading-[1.55] text-muted">
          부족한 부분은 문장을 더 적으면 AI가 알아서 반영해요.
        </div>
      </aside>
    </div>
  );
}
