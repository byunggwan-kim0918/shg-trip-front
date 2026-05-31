'use client';

import { useMemo } from 'react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import CalendarPicker from '@/components/itinerary/wizard/CalendarPicker';
import { formatBudget, parseBudget } from '@/lib/utils/format';

function getDurationText(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return `${nights}박 ${nights + 1}일`;
}

export default function BudgetDateStep() {
  const { data, updateData } = useWizardStore();

  const budgetDisplay = data.budget ? formatBudget(data.budget) : '';
  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;
  const durationText = useMemo(() => {
    if (data.startDate && data.endDate) return getDurationText(data.startDate, data.endDate);
    return null;
  }, [data.startDate, data.endDate]);

  const handleBudgetChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    updateData({ budget: digits ? parseBudget(digits) : null });
  };

  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    updateData({
      startDate: start ? toLocalDateStr(start) : null,
      endDate: end ? toLocalDateStr(end) : null,
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">예산</h2>
        <p className="text-sm text-muted">여행 예산을 입력하세요 (선택)</p>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={budgetDisplay}
            onChange={(e) => handleBudgetChange(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 pr-10 rounded-lg border border-card-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">원</span>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">여행 기간</h2>
        <p className="text-sm text-muted">시작일과 종료일을 선택하세요</p>
        <CalendarPicker startDate={startDate} endDate={endDate} onDateChange={handleDateChange} />
        {durationText && (
          <p className="text-sm font-medium text-accent">{durationText}</p>
        )}
      </div>
    </div>
  );
}
