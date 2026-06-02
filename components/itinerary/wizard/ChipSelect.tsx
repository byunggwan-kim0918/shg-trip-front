'use client';

import type { ReactNode } from 'react';

interface ChipOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minSelect?: number;
}

export default function ChipSelect({ options, selected, onChange, minSelect = 1 }: ChipSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      // minSelect 이하로 내려가지 않도록 방지
      if (selected.length <= minSelect) return;
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-150 min-h-[44px]
              ${isSelected
                ? 'bg-accent text-white shadow-sm border border-transparent'
                : 'bg-surface text-foreground border border-card-border hover:bg-surface-hover'
              }
            `}
            aria-pressed={isSelected}
          >
            {opt.icon && <span className="text-base">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
