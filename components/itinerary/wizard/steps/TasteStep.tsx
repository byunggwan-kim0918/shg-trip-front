'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';
import { THEME_OPTIONS, CATEGORY_OPTIONS } from '@/lib/constants/wizardOptions';
import type { Theme, Category } from '@/lib/types/itinerary';

/** 2단계: 취향 (6b). 테마 카드 그리드 + 세부 카테고리 칩. */
export default function TasteStep() {
  const { data, updateData } = useWizardStore();

  const toggleTheme = (id: Theme) => {
    const next = data.themes.includes(id)
      ? data.themes.filter((x) => x !== id)
      : [...data.themes, id];
    updateData({ themes: next });
  };

  const toggleCategory = (id: Category) => {
    const next = data.categories.includes(id)
      ? data.categories.filter((x) => x !== id)
      : [...data.categories, id];
    updateData({ categories: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">어떤 취향이세요?</h2>
        <p className="mt-1 text-[13.5px] text-muted">
          테마와 세부 카테고리를 골라주세요. <span className="text-muted-2">(여러 개)</span>
        </p>
      </div>

      {/* 테마 카드 */}
      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">테마</div>
        <div className="grid grid-cols-3 gap-2.5">
          {THEME_OPTIONS.map((t) => {
            const active = data.themes.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTheme(t.id)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-[7px] rounded-[13px] border px-2 py-3.5 transition-colors ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <t.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[12.5px] font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 세부 카테고리 칩 */}
      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">세부 카테고리</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((c) => {
            const active = data.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                  active ? 'bg-accent text-white' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
