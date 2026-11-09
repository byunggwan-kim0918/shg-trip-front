'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { NEW_TRIP_SENTENCE_KEY, NEW_TRIP_PARSED_KEY, SENTENCE_PLACEHOLDER } from '@/lib/constants/newTrip';
import { parseTripSentence, type ParsedTrip } from '@/lib/data/itineraryService';
import { useGenerationQuota } from '@/lib/hooks/useGenerationQuota';
import { THEME_LABEL, PACE_LABEL } from '@/lib/constants/wizardOptions';
import { dateRange, nightsLabel } from '@/lib/utils/tripStatus';
import { formatBudget } from '@/lib/utils/format';
import GenerationQuotaBadge from '@/components/itinerary/GenerationQuotaBadge';

const BUDGET_CHIPS: Array<{ label: string; phrase: string }> = [
  { label: '50만원', phrase: '예산은 50만원' },
  { label: '100만원', phrase: '예산은 100만원' },
  { label: '상관없음', phrase: '예산은 상관없음' },
];

const DEBOUNCE_MS = 600;
const MIN_PARSE_LEN = 8;

// 셸→마법사는 같은 라우트의 쿼리 전환이라 뒤로가기로 돌아오면 셸이 새로 마운트된다.
// 입력하던 문장을 되살리려고 모듈 범위에 둔다(새로고침이면 비워지는 게 맞다).
let shellDraft = '';

export function clearShellDraft() {
  shellDraft = '';
}

function UnderstandRow({ label, value, last }: { label: string; value: string | null; last?: boolean }) {
  const filled = !!value;
  return (
    <div className={`flex items-center justify-between gap-3 py-3 ${last ? '' : 'border-b border-divider'}`}>
      <span className="shrink-0 text-[13px] font-semibold text-muted-2">{label}</span>
      <span className={`truncate text-right text-[15px] font-bold ${filled ? 'text-foreground' : 'text-muted-2'}`}>
        {value ?? '-'}
      </span>
    </div>
  );
}

export default function NewTripShell() {
  const router = useRouter();
  const [sentence, setSentence] = useState(() => shellDraft);
  const [budgetChip, setBudgetChip] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTrip | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const { quota } = useGenerationQuota();

  // BFF를 거치면 abort가 늦게 닿을 수 있어 단조증가 seq로 늦은 응답을 버린다.
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // parsed가 대응하는 문장. 현재 문장과 같을 때만 구조화 프리필에 쓴다.
  const parsedForRef = useRef('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = sentence.trim();
    if (trimmed.length < MIN_PARSE_LEN) {
      // 진행 중 응답이 패널을 되살리지 못하게 seq를 무효화하고 abort한다.
      seqRef.current++;
      abortRef.current?.abort();
      parsedForRef.current = '';
      setParsed(null);
      setParsing(false);
      setParseError(null);
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
        if (seq === seqRef.current) {
          setParsed(result);
          parsedForRef.current = trimmed;
          setParseError(null);
          setParsing(false);
        }
      } catch (e) {
        if (seq !== seqRef.current) return;
        setParsing(false);
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // 이전 문장의 결과를 남겨 두면 지금 문장을 그렇게 이해한 것처럼 보인다
        setParsed(null);
        parsedForRef.current = '';
        setParseError(e instanceof Error ? e.message : '문장을 분석하지 못했어요.');
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

  const goWizard = useCallback((withSentence: boolean) => {
    const trimmed = sentence.trim();
    if (withSentence && trimmed) {
      // 빠른 클릭 시 미완·이전 문장 결과가 섞이지 않게 parsed가 현재 문장에 대응할 때만 넘긴다.
      // 아니면 문장만 넘겨 builder(page.tsx path 2)가 다시 파싱한다.
      const canUseParsed = parsed != null && parsedForRef.current === trimmed;
      if (canUseParsed) {
        sessionStorage.setItem(NEW_TRIP_PARSED_KEY, JSON.stringify({ sentence: trimmed, parsed }));
        sessionStorage.removeItem(NEW_TRIP_SENTENCE_KEY);
      } else {
        sessionStorage.removeItem(NEW_TRIP_PARSED_KEY);
        sessionStorage.setItem(NEW_TRIP_SENTENCE_KEY, trimmed);
      }
    }
    shellDraft = sentence;
    router.push('/main/plan/new?builder=1');
  }, [sentence, parsed, router]);

  const periodValue = parsed?.startDate && parsed?.endDate
    ? `${dateRange(parsed.startDate, parsed.endDate)} (${nightsLabel(parsed.startDate, parsed.endDate)})`
    : parsed?.startDate ?? null;
  const themeValue = parsed?.themes && parsed.themes.length > 0
    ? parsed.themes.map((t) => THEME_LABEL[t] ?? t).join('·')
    : null;
  const paceValue = parsed?.pace ? PACE_LABEL[parsed.pace] ?? parsed.pace : null;
  const budgetValue = parsed?.budget != null ? `${formatBudget(parsed.budget)}원` : null;

  const hasAnyParsed = Boolean(
    parsed?.destination || periodValue || parsed?.party || themeValue || paceValue || budgetValue,
  );
  const sentenceEmpty = sentence.trim().length === 0;
  const understoodNothing = !parsing && parsed != null && !hasAnyParsed;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-6 lg:flex-row lg:gap-9 lg:py-10">
      <div className="min-w-0 flex-1">
        <div className="mb-2 text-[13px] font-semibold text-muted-2">새 여행</div>
        <h1 className="mb-5 text-[23px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[30px]">
          어떤 여행을 꿈꾸세요?
        </h1>

        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={SENTENCE_PLACEHOLDER}
          autoFocus
          rows={4}
          maxLength={500}
          className="min-h-[108px] w-full resize-none rounded-xl border-[1.5px] border-accent bg-card-bg p-5 focus:ring-2 focus:ring-accent/25 text-[17px] leading-[1.7] text-foreground shadow-[0_14px_34px_-20px_rgba(20,22,28,0.45)] outline-none placeholder:text-muted-2"
          aria-label="여행 문장 입력"
        />

        {/* 예산 넛지는 경고가 아니라 도움말이라 warn 색을 쓰면 아래 '한도 초과' 안내와 위계가 뒤엉킨다. */}
        <div className="mt-3.5 flex flex-col gap-3 rounded-[10px] border border-card-border bg-surface-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-[13px] font-semibold text-text-2">
            예산이 있으면 알려주세요 · 일행 전체, 숙박 포함
          </span>
          <div className="flex gap-2 sm:ml-auto">
            {BUDGET_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => applyBudgetChip(chip)}
                className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  budgetChip === chip.label
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:border-muted'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => goWizard(true)}
            disabled={sentenceEmpty}
            title={sentenceEmpty ? '여행 문장을 먼저 적어주세요' : undefined}
            className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-4 text-[15px] font-bold text-accent-fg shadow-[0_10px_24px_-10px_rgba(20,22,28,0.45)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
          >
            <Sparkles size={16} aria-hidden="true" /> 일정 만들기
          </button>
          <button
            type="button"
            onClick={() => goWizard(false)}
            className="rounded-[10px] border border-card-border bg-card-bg px-6 py-4 text-[15px] font-semibold text-text-2 transition-colors hover:bg-surface-hover"
          >
            직접 고를래요
          </button>
        </div>

        {quota && (
          <div className="mt-3">
            <GenerationQuotaBadge quota={quota} />
          </div>
        )}
      </div>

      <aside className="w-full shrink-0 self-start rounded-xl border border-divider bg-card-bg p-6 lg:w-[400px]">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={15} className="text-accent-weak-fg" aria-hidden="true" />
          <span className="text-[15px] font-bold text-foreground">이렇게 이해했어요</span>
          {parsing && <Loader2 size={14} className="ml-auto animate-spin text-muted-2" aria-hidden="true" />}
        </div>
        <div className="mb-5 text-xs text-muted-2">
          문장을 쓰면 자동으로 인식해요. 다음 단계에서 확인·수정할 수 있어요.
        </div>

        {hasAnyParsed ? (
          <>
            <div className="flex flex-col gap-0.5">
              <UnderstandRow label="여행지" value={parsed?.destination ?? null} />
              <UnderstandRow label="기간" value={periodValue} />
              <UnderstandRow label="인원" value={parsed?.party ?? null} />
              <UnderstandRow label="테마" value={themeValue} />
              <UnderstandRow label="페이스" value={paceValue} />
              <UnderstandRow label="예산" value={budgetValue} last />
            </div>
            <div className="mt-4 rounded-[10px] bg-surface-3 px-4 py-3 text-xs leading-[1.55] text-muted">
              표에 없는 취향(좋아하는 음식 등)도 문장 그대로 &lsquo;추가 요청&rsquo;으로 전달돼 장소를 고를 때 참고해요.
            </div>
          </>
        ) : parseError || understoodNothing ? (
          <div role="status" className="rounded-[10px] bg-warn-bg px-4 py-3 text-xs leading-[1.55] text-warn-fg">
            {parseError ?? '이해하지 못했어요. 여행지와 기간을 넣어 다시 적어주세요.'}
          </div>
        ) : (
          /* 전부 '—'인 표는 정보가 없으므로 무엇을 알아듣는지 알려준다. */
          <>
            <ul className="flex flex-wrap gap-2">
              {['여행지', '기간', '인원', '테마', '페이스'].map((k) => (
                <li key={k} className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-semibold text-muted">
                  {k}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-[1.55] text-muted-2">{SENTENCE_PLACEHOLDER}</p>
          </>
        )}
      </aside>
    </div>
  );
}
