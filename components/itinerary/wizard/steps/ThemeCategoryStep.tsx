'use client';

import { useEffect } from 'react';
import {
  Leaf,
  Zap,
  Utensils,
  Landmark,
  ShoppingBag,
  TreePine,
  LucideIcon,
} from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import ChipSelect from '@/components/itinerary/wizard/ChipSelect';
import type { Theme, Category } from '@/lib/types/itinerary';

const THEME_OPTIONS: { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: 'healing', label: '힐링', icon: Leaf },
  { id: 'activity', label: '액티비티', icon: Zap },
  { id: 'food', label: '맛집 탐방', icon: Utensils },
  { id: 'culture', label: '문화/역사', icon: Landmark },
  { id: 'shopping', label: '쇼핑', icon: ShoppingBag },
  { id: 'nature', label: '자연/풍경', icon: TreePine },
];

const CATEGORY_OPTIONS: { id: Category; label: string }[] = [
  { id: 'attraction', label: '관광지' },
  { id: 'restaurant', label: '맛집' },
  { id: 'cafe', label: '카페' },
  { id: 'accommodation', label: '숙박' },
  { id: 'experience', label: '체험/액티비티' },
  { id: 'shopping', label: '쇼핑' },
];

export default function ThemeCategoryStep() {
  const { data, updateData, setStepValid } = useWizardStore();

  useEffect(() => {
    setStepValid(data.themes.length >= 1 && data.categories.length >= 1);
  }, [data.themes, data.categories, setStepValid]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">여행 테마</h2>
        <p className="text-sm text-muted">어떤 여행을 원하시나요? (1개 이상 선택)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((t) => {
            const isSelected = data.themes.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const next = isSelected
                    ? data.themes.filter((x) => x !== t.id)
                    : [...data.themes, t.id];
                  updateData({ themes: next });
                }}
                className={`
                  flex flex-col items-center gap-1.5 p-4 rounded-xl text-sm font-medium
                  transition-all duration-150 min-h-[44px] border
                  ${isSelected
                    ? 'bg-accent-soft border-accent text-accent'
                    : 'bg-card-bg border-card-border text-foreground hover:bg-surface-hover'
                  }
                `}
                aria-pressed={isSelected}
              >
                <t.icon size={24} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">카테고리</h2>
        <p className="text-sm text-muted">관심 있는 카테고리를 선택하세요 (1개 이상)</p>
        <ChipSelect
          options={CATEGORY_OPTIONS}
          selected={data.categories}
          onChange={(categories) => updateData({ categories: categories as Category[] })}
          minSelect={0}
        />
      </div>
    </div>
  );
}
