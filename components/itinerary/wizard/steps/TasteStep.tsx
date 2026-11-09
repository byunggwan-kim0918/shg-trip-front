'use client';

import { useWizardStore, MAX_TASTE_SELECTIONS } from '@/lib/stores/useWizardStore';
import { THEME_OPTIONS, CATEGORY_OPTIONS } from '@/lib/constants/wizardOptions';
import type { Theme, Category } from '@/lib/types/itinerary';

export default function TasteStep() {
  const { data, updateData } = useWizardStore();

  const themesFull = data.themes.length >= MAX_TASTE_SELECTIONS;
  const categoriesFull = data.categories.length >= MAX_TASTE_SELECTIONS;

  const toggleTheme = (id: Theme) => {
    if (data.themes.includes(id)) updateData({ themes: data.themes.filter((x) => x !== id) });
    else if (!themesFull) updateData({ themes: [...data.themes, id] });
  };

  const toggleCategory = (id: Category) => {
    if (data.categories.includes(id)) updateData({ categories: data.categories.filter((x) => x !== id) });
    else if (!categoriesFull) updateData({ categories: [...data.categories, id] });
  };

  const missingHint = data.themes.length === 0 && data.categories.length > 0
    ? '테마를 1개 이상 골라 주세요.'
    : data.themes.length > 0 && data.categories.length === 0
      ? '세부 카테고리를 1개 이상 골라 주세요.'
      : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">어떤 취향이세요?</h2>
        <p className="mt-1 text-[13px] text-muted">
          테마와 세부 카테고리를 골라주세요. <span className="text-muted-2">(각각 최대 {MAX_TASTE_SELECTIONS}개)</span>
        </p>
      </div>

      <div>
        <div className="mb-2.5 flex justify-between text-xs font-bold tracking-[0.03em] text-muted-2">
          <span>테마</span>
          <span className={`tabular-nums ${themesFull ? 'text-accent-weak-fg' : ''}`}>{data.themes.length}/{MAX_TASTE_SELECTIONS}</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {THEME_OPTIONS.map((t) => {
            const active = data.themes.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTheme(t.id)}
                aria-pressed={active}
                disabled={!active && themesFull}
                className={`flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'border-[1.5px] border-accent bg-accent-soft text-accent-weak-fg'
                    : 'border-card-border bg-card-bg text-text-2 hover:bg-surface-hover'
                }`}
              >
                <t.icon size={20} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex justify-between text-xs font-bold tracking-[0.03em] text-muted-2">
          <span>세부 카테고리</span>
          <span className={`tabular-nums ${categoriesFull ? 'text-accent-weak-fg' : ''}`}>{data.categories.length}/{MAX_TASTE_SELECTIONS}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((c) => {
            const active = data.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                aria-pressed={active}
                disabled={!active && categoriesFull}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <p role="status" className="min-h-[1rem] text-xs font-semibold text-accent-weak-fg">{missingHint}</p>
    </div>
  );
}
