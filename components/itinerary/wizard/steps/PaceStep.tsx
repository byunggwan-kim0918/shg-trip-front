'use client';

import { useWizardStore } from '@/lib/stores/useWizardStore';
import type { TripPace } from '@/lib/types/itinerary';

const PACE_OPTIONS: { id: TripPace; label: string; icon: string; desc: string }[] = [
  { id: 'tight', label: '알차게', icon: '⚡', desc: '하루 5~7곳, 빈틈없이 돌아다니기' },
  { id: 'normal', label: '보통', icon: '🚶', desc: '하루 4~5곳, 적당한 여유와 관광' },
  { id: 'relaxed', label: '여유롭게', icon: '☕', desc: '하루 2~3곳, 느긋하게 즐기기' },
];

export default function PaceStep() {
  const { data, updateData } = useWizardStore();

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">여행 페이스</h2>
      <p className="text-sm text-muted">일정을 얼마나 빡빡하게 잡을까요?</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PACE_OPTIONS.map((p) => {
          const isSelected = data.pace === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => updateData({ pace: p.id })}
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
              <span className="text-3xl">{p.icon}</span>
              <span className="font-semibold">{p.label}</span>
              <span className="text-xs text-muted text-center">{p.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
