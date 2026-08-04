'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY, NEW_TRIP_PARSED_KEY, SENTENCE_PLACEHOLDER } from '@/lib/constants/newTrip';
import { parseTripSentence, type ParsedTrip } from '@/lib/data/itineraryService';
import { useGenerationQuota } from '@/lib/hooks/useGenerationQuota';
import { THEME_LABEL, PACE_LABEL } from '@/lib/constants/wizardOptions';
import { dateRange, nightsLabel } from '@/lib/utils/tripStatus';
import GenerationQuotaBadge from '@/components/itinerary/GenerationQuotaBadge';

/** 예산 퀵칩: 라벨 + 문장에 덧붙일 구절. */
const BUDGET_CHIPS: Array<{ label: string; phrase: string }> = [
  { label: '50만원', phrase: '예산은 50만원' },
  { label: '100만원', phrase: '예산은 100만원' },
  { label: '상관없음', phrase: '예산은 상관없음' },
];

const DEBOUNCE_MS = 600;
const MIN_PARSE_LEN = 8;

/** "이해했어요" 패널 한 줄. */
function UnderstandRow({ label, value, last }: { label: string; value: string | null; last?: boolean }) {
  const filled = !!value;
  return (
    <div className={`flex items-center justify-between gap-3 py-[13px] ${last ? '' : 'border-b border-divider'}`}>
      <span className="shrink-0 text-[13px] font-semibold text-muted-2">{label}</span>
      <span className={`truncate text-right text-[14.5px] font-bold ${filled ? 'text-foreground' : 'text-muted-2'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

/**
 * AI 새 여행 셸 (리디자인 2c/3c).
 * Layer B: 타이핑 → 디바운스 → /parse 실시간 패널 갱신 + 마법사 구조화 프리필.
 * 파싱 결과는 sessionStorage(NEW_TRIP_PARSED_KEY)로 넘겨 builder에서 필드 프리필 + ConfirmStep 점프.
 */
export default function NewTripShell() {
  const router = useRouter();
  const [sentence, setSentence] = useState('');
  const [budgetChip, setBudgetChip] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTrip | null>(null);
  const [parsing, setParsing] = useState(false);
  const { quota } = useGenerationQuota();

  // 스테일 응답 드롭용 단조증가 seq (BFF 경유 abort 레이스 대비) + 진행중 요청 취소.
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // parsed가 대응하는 문장(불변식). 이 값이 현재 문장과 같을 때만 구조화 프리필에 신뢰.
  const parsedForRef = useRef('');

  // 문장 변경 → 디바운스 파싱
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = sentence.trim();
    if (trimmed.length < MIN_PARSE_LEN) {
      // in-flight 응답이 패널을 되살리지 못하도록 seq 무효화 + abort
      seqRef.current++;
      abortRef.current?.abort();
      parsedForRef.current = '';
      setParsed(null);
      setParsing(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const seq = ++seqRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setParsing(true);
      try {
        const result = await parseTripSentence(trimmed, controller.signal);
        // 최신 요청만 반영 (stale 드롭)
        if (seq === seqRef.current) {
          if (result) {
            setParsed(result);
            parsedForRef.current = trimmed;
          }
          setParsing(false);
        }
      } catch {
        // AbortError 또는 네트워크 실패 — 조용히 무시(패널 유지)
        if (seq === seqRef.current) setParsing(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sentence]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const applyBudgetChip = (chip: (typeof BUDGET_CHIPS)[number]) => {
    setBudgetChip(chip.label);
    setSentence((prev) => {
      const stripped = prev
        .replace(/,?\s*예산은 (50만원|100만원|상관없음)/g, '')
        .trimEnd();
      if (!stripped) return chip.phrase;
      return `${stripped}, ${chip.phrase}`;
    });
  };

  // withSentence면 파싱 결과+원문을 sessionStorage로 넘겨 builder에서 프리필/점프.
  const goWizard = useCallback((withSentence: boolean) => {
    const trimmed = sentence.trim();
    if (withSentence && trimmed) {
      // parsed가 "현재 문장"에 대응할 때만 구조화 프리필로 넘긴다(빠른 클릭 시 stale/미완 혼입 방지).
      // 미완·불일치면 문장만 넘겨 builder(page.tsx path 2)가 신선하게 재파싱하도록 위임.
      const canUseParsed = parsed != null && parsedForRef.current === trimmed;
      if (canUseParsed) {
        sessionStorage.setItem(NEW_TRIP_PARSED_KEY, JSON.stringify({ sentence: trimmed, parsed }));
        sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
      } else {
        sessionStorage.removeItem(NEW_TRIP_PARSED_KEY);
        sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, trimmed);
      }
    }
    router.replace('/main/plan/new?builder=1');
  }, [sentence, parsed, router]);

  // 패널 표시값 (미추론은 null → "—")
  const periodValue = parsed?.startDate && parsed?.endDate
    ? `${dateRange(parsed.startDate, parsed.endDate)} (${nightsLabel(parsed.startDate, parsed.endDate)})`
    : parsed?.startDate ?? null;
  const themeValue = parsed?.themes && parsed.themes.length > 0
    ? parsed.themes.map((t) => THEME_LABEL[t] ?? t).join('·')
    : null;
  const paceValue = parsed?.pace ? PACE_LABEL[parsed.pace] ?? parsed.pace : null;

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
          maxLength={500}
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

        {/* 생성 쿼터 배지 (30일 최대 5회) */}
        {quota && (
          <div className="mt-3">
            <GenerationQuotaBadge quota={quota} />
          </div>
        )}
      </div>

      {/* 우: AI 이해 요약 패널 */}
      <aside className="w-full shrink-0 self-start rounded-[18px] border border-divider bg-card-bg p-6 lg:w-[400px]">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={15} className="text-accent" aria-hidden="true" />
          <span className="text-[15px] font-bold text-foreground">AI가 이렇게 이해했어요</span>
          {parsing && <Loader2 size={14} className="ml-auto animate-spin text-muted-2" aria-hidden="true" />}
        </div>
        <div className="mb-[18px] text-[12.5px] text-muted-2">
          문장을 쓰면 자동으로 인식해요. 다음 단계에서 확인·수정할 수 있어요.
        </div>

        <div className="flex flex-col gap-0.5">
          <UnderstandRow label="여행지" value={parsed?.destination ?? null} />
          <UnderstandRow label="기간" value={periodValue} />
          <UnderstandRow label="인원" value={parsed?.party ?? null} />
          <UnderstandRow label="테마" value={themeValue} />
          <UnderstandRow label="페이스" value={paceValue} last />
        </div>

        <div className="mt-4 rounded-xl bg-surface-3 px-[15px] py-[13px] text-[12.5px] leading-[1.55] text-muted">
          부족한 부분은 문장을 더 적으면 AI가 알아서 반영해요.
        </div>
      </aside>
    </div>
  );
}
