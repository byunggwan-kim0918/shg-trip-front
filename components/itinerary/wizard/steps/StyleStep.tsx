'use client';

import { Minus, Plus } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import {
  PACE_OPTIONS, TRANSPORT_OPTIONS, COMPANION_OPTIONS, DEFAULT_PARTY_SIZE, MAX_PARTY_SIZE,
} from '@/lib/constants/wizardOptions';
import type { Companion } from '@/lib/types/itinerary';

export default function StyleStep() {
  const { data, updateData } = useWizardStore();
  const defaultParty = data.companion ? DEFAULT_PARTY_SIZE[data.companion] : undefined;
  const partyShown = defaultParty != null ? (data.partySize ?? defaultParty) : null;

  const selectCompanion = (id: Companion) => {
    // 동행이 바뀌면 이전 동행 기준 인원은 맞지 않아 비운다.
    const next = data.companion === id ? null : id;
    updateData({ companion: next, partySize: next === data.companion ? data.partySize : null });
  };

  const changeParty = (delta: number) => {
    if (partyShown == null) return;
    updateData({ partySize: Math.min(MAX_PARTY_SIZE, Math.max(1, partyShown + delta)) });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">여행 스타일</h2>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-xs font-bold tracking-[0.03em] text-muted-2">누구와</span>
          <span className="text-xs text-muted-2">선택</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {COMPANION_OPTIONS.map((c) => {
            const active = data.companion === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCompanion(c.id)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {partyShown != null && (
          <div className="mt-2.5 flex items-center justify-between rounded-[10px] bg-surface-3 px-3.5 py-2">
            <span className="text-[13px] font-semibold text-text-2">인원</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeParty(-1)}
                disabled={partyShown <= 1}
                aria-label="인원 줄이기"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card-bg text-text-2 transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span
                className={`w-9 text-center text-[15px] font-bold ${data.partySize == null ? 'text-muted-2' : 'text-foreground'}`}
                aria-live="polite"
              >
                {partyShown}명
              </span>
              <button
                type="button"
                onClick={() => changeParty(1)}
                disabled={partyShown >= MAX_PARTY_SIZE}
                aria-label="인원 늘리기"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card-bg text-text-2 transition-colors hover:bg-surface-hover disabled:opacity-40"
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">하루 페이스</div>
        <div className="grid grid-cols-3 gap-2.5">
          {PACE_OPTIONS.map((p) => {
            const active = data.pace === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => updateData({ pace: p.id })}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3.5 text-center transition-colors ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <p.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13px] font-bold">{p.label}</span>
                <span className="text-xs text-muted-2">{p.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-2">점심·저녁 식사는 빼고 센 숫자예요.</p>
      </div>

      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">이동 방법</div>
        <div className="grid grid-cols-3 gap-2.5">
          {TRANSPORT_OPTIONS.map((t) => {
            const active = data.transportPref === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updateData({ transportPref: t.id })}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3.5 text-center transition-colors ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <t.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13px] font-bold">{t.label}</span>
                <span className="text-xs text-muted-2">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
