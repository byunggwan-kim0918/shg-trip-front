'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';
import { PACE_OPTIONS, TRANSPORT_OPTIONS } from '@/lib/constants/wizardOptions';

/** 3단계: 스타일 (6c). 하루 페이스 3카드 + 이동 방법 3카드 (단일 선택). */
export default function StyleStep() {
  const { data, updateData } = useWizardStore();

  return (
    <div className="space-y-5">
      <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">여행 스타일</h2>

      {/* 하루 페이스 */}
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
                className={`flex flex-col items-center gap-1.5 rounded-[13px] border px-2 py-3.5 text-center transition-colors ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <p.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13.5px] font-bold">{p.label}</span>
                <span className="text-[11px] text-muted-2">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 이동 방법 */}
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
                className={`flex flex-col items-center gap-1.5 rounded-[13px] border px-2 py-3.5 text-center transition-colors ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <t.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13.5px] font-bold">{t.label}</span>
                <span className="text-[11px] text-muted-2">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
