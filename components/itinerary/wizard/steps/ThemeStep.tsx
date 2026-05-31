'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';
import type { Theme } from '@/lib/types/itinerary';

const THEME_OPTIONS: { id: Theme; label: string; icon: string }[] = [
  { id: 'healing', label: '힐링', icon: '🧘' },
  { id: 'activity', label: '액티비티', icon: '🏄' },
  { id: 'food', label: '맛집 탐방', icon: '🍽️' },
  { id: 'culture', label: '문화/역사', icon: '🏛️' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️' },
  { id: 'nature', label: '자연/풍경', icon: '🌿' },
  { id: 'adventure', label: '모험/탐험', icon: '🧗' },
  { id: 'romance', label: '로맨틱', icon: '💑' },
  { id: 'family', label: '가족여행', icon: '👨‍👩‍👧' },
  { id: 'budget', label: '알뜰여행', icon: '💰' },
  { id: 'luxury', label: '럭셔리', icon: '✨' },
  { id: 'photo', label: '사진/인스타', icon: '📸' },
  { id: 'walking', label: '도보/산책', icon: '🚶' },
  { id: 'ocean', label: '바다/해변', icon: '🏖️' },
  { id: 'mountain', label: '산/트레킹', icon: '⛰️' },
  { id: 'nightview', label: '야경/야간', icon: '🌃' },
  { id: 'local', label: '로컬 체험', icon: '🏘️' },
  { id: 'art', label: '예술/전시', icon: '🎨' },
  { id: 'festival', label: '축제/이벤트', icon: '🎪' },
  { id: 'pet', label: '반려동물', icon: '🐕' },
];

export default function ThemeStep() {
  const { data, updateData } = useWizardStore();

  return (
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
              <span className="text-2xl">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
