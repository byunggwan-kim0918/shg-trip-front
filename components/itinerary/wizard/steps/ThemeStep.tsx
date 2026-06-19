'use client';

import {
  Leaf,
  Zap,
  Utensils,
  Landmark,
  ShoppingBag,
  TreePine,
  Compass,
  Heart,
  Users,
  Wallet,
  Crown,
  Camera,
  Footprints,
  Waves,
  Mountain,
  Moon,
  Home,
  Palette,
  PartyPopper,
  PawPrint,
  LucideIcon,
} from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import type { Theme } from '@/lib/types/itinerary';

const THEME_OPTIONS: { id: Theme; label: string; icon: LucideIcon }[] = [
  { id: 'healing', label: '힐링', icon: Leaf },
  { id: 'activity', label: '액티비티', icon: Zap },
  { id: 'food', label: '맛집 탐방', icon: Utensils },
  { id: 'culture', label: '문화/역사', icon: Landmark },
  { id: 'shopping', label: '쇼핑', icon: ShoppingBag },
  { id: 'nature', label: '자연/풍경', icon: TreePine },
  { id: 'adventure', label: '모험/탐험', icon: Compass },
  { id: 'romance', label: '로맨틱', icon: Heart },
  { id: 'family', label: '가족여행', icon: Users },
  { id: 'budget', label: '알뜰여행', icon: Wallet },
  { id: 'luxury', label: '럭셔리', icon: Crown },
  { id: 'photo', label: '사진/인스타', icon: Camera },
  { id: 'walking', label: '도보/산책', icon: Footprints },
  { id: 'ocean', label: '바다/해변', icon: Waves },
  { id: 'mountain', label: '산/트레킹', icon: Mountain },
  { id: 'nightview', label: '야경/야간', icon: Moon },
  { id: 'local', label: '로컬 체험', icon: Home },
  { id: 'art', label: '예술/전시', icon: Palette },
  { id: 'festival', label: '축제/이벤트', icon: PartyPopper },
  { id: 'pet', label: '반려동물', icon: PawPrint },
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
              <t.icon size={24} aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
