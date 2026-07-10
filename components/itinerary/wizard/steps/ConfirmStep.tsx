'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { formatBudget } from '@/lib/utils/format';
import { nightsLabel, dateRange } from '@/lib/utils/tripStatus';
import {
  THEME_LABEL, CATEGORY_LABEL, PACE_LABEL, TRANSPORT_LABEL,
} from '@/lib/constants/wizardOptions';

/** 5단계: 확인 → 생성 (6e). 요약 + "AI에게 한마디"(선택) + 생성. */
export default function ConfirmStep() {
  const router = useRouter();
  const { data, setStep } = useWizardStore();

  const themeCat = [
    data.themes.map((t) => THEME_LABEL[t] ?? t).join('·'),
    data.categories.map((c) => CATEGORY_LABEL[c] ?? c).join('·'),
  ].filter(Boolean).join(' / ');

  const rows: { label: string; value: string; step: number }[] = [
    {
      label: '여행지 · 기간',
      value: data.startDate && data.endDate
        ? `${data.destination} · ${dateRange(data.startDate, data.endDate)} (${nightsLabel(data.startDate, data.endDate)})`
        : data.destination,
      step: 0,
    },
    { label: '취향', value: themeCat || '미설정', step: 1 },
    {
      label: '스타일',
      value: `${PACE_LABEL[data.pace] ?? data.pace} · ${TRANSPORT_LABEL[data.transportPref] ?? data.transportPref}`,
      step: 2,
    },
    { label: '예산', value: data.budget ? `${formatBudget(data.budget)}원` : 'AI에게 맡김', step: 3 },
    {
      label: '필수 장소',
      value: data.selectedPlaces.length > 0 ? data.selectedPlaces.map((p) => p.name).join(' · ') : '없음',
      step: 3,
    },
  ];

  const handleGenerate = () => {
    if (!data.startDate || !data.endDate) {
      setStep(0);
      return;
    }
    router.push('/main/itinerary/loading');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">이대로 만들까요?</h2>

      {/* 요약 (행 클릭 → 해당 단계로) */}
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <button
            key={row.label}
            type="button"
            onClick={() => setStep(row.step)}
            className={`flex items-center justify-between gap-3 py-3 text-left transition-colors hover:opacity-80 ${
              i < rows.length - 1 ? 'border-b border-divider' : ''
            }`}
          >
            <span className="shrink-0 text-[13px] font-semibold text-muted-2">{row.label}</span>
            <span className="text-right text-[13.5px] font-bold text-foreground">{row.value}</span>
          </button>
        ))}
      </div>

      {/* AI에게 한마디 */}
      <div>
        <div className="mb-2 text-xs font-bold tracking-[0.03em] text-muted-2">
          AI에게 한마디 <span className="font-semibold text-muted-2/70">(선택)</span>
        </div>
        <textarea
          value={data.description}
          onChange={(e) => useWizardStore.getState().updateData({ description: e.target.value })}
          placeholder="예: 아이가 있어서 이동은 짧게, 저녁은 흑돼지 맛집 꼭이요."
          rows={3}
          className="w-full resize-none rounded-[13px] border border-card-border bg-surface-3 px-4 py-3.5 text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-2 focus:border-accent"
        />
      </div>

      {/* 생성 CTA */}
      <button
        type="button"
        onClick={handleGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-accent py-[15px] text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_var(--accent)] transition-[filter] hover:brightness-105"
      >
        <Sparkles size={16} aria-hidden="true" /> 이대로 일정 만들기
      </button>
    </div>
  );
}
