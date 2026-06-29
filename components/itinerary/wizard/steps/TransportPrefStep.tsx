'use client';

import { Footprints, Car, Shuffle, LucideIcon } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import type { TransportPref } from '@/lib/types/itinerary';

const TRANSPORT_OPTIONS: { id: TransportPref; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'walk', label: '도보 우선', icon: Footprints, desc: '가깝거나 대중교통으로 갈 만한 동선' },
  { id: 'car', label: '자동차 우선', icon: Car, desc: '거리는 넉넉하게, 멀어도 OK' },
  { id: 'any', label: '상관없음', icon: Shuffle, desc: '자유롭게 알아서 구성' },
];

export default function TransportPrefStep() {
  const { data, updateData } = useWizardStore();

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">이동 방법</h2>
      <p className="text-sm text-muted">장소 사이를 어떻게 이동할까요?</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRANSPORT_OPTIONS.map((t) => {
          const isSelected = data.transportPref === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => updateData({ transportPref: t.id })}
              className={`
                flex flex-col items-center gap-2 p-5 rounded-xl text-sm font-medium
                transition-all duration-150 border
                ${isSelected
                  ? 'bg-accent-soft border-accent text-accent ring-2 ring-accent/20'
                  : 'bg-card-bg border-card-border text-foreground hover:bg-surface-hover'
                }
              `}
              aria-pressed={isSelected}
            >
              <t.icon size={28} aria-hidden="true" />
              <span className="font-semibold">{t.label}</span>
              <span className="text-xs text-muted text-center">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
