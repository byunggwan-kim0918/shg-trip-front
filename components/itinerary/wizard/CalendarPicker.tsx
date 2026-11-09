'use client';

import { useState, useMemo } from 'react';

interface CalendarPickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  minDate?: Date;
  /** 최대 선택 가능 기간(일, 당일 포함). 시작일 선택 후 이 범위를 넘는 종료일은 비활성화. */
  maxRangeDays?: number;
}

/** 오늘부터 이 개월 수 안에서만 시작일을 고른다. 서버는 미래 날짜 상한이 없어 먼 해의 일정이 만들어진다. */
const MAX_MONTHS_AHEAD = 12;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function CalendarPicker({ startDate, endDate, onDateChange, minDate, maxRangeDays }: CalendarPickerProps) {
  const today = stripTime(new Date());
  const effectiveMin = minDate ? stripTime(minDate) : today;
  const normalizedStart = startDate ? stripTime(startDate) : null;
  const normalizedEnd = endDate ? stripTime(endDate) : null;
  const [viewDate, setViewDate] = useState(() => normalizedStart ?? today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const lastSelectable = new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD, today.getDate());

  // 서버가 종료일이 시작일보다 뒤여야 받아서, 시작일을 다시 누르면 당일 대신 선택을 푼다.
  const handleClick = (date: Date) => {
    if (!normalizedStart || normalizedEnd || date.getTime() < normalizedStart.getTime()) {
      onDateChange(date, null);
    } else if (isSameDay(date, normalizedStart)) {
      onDateChange(null, null);
    } else {
      onDateChange(normalizedStart, date);
    }
  };

  const disabledReason = (date: Date): 'past' | 'tooFar' | 'overRange' | null => {
    const d = date.getTime();
    if (d < effectiveMin.getTime()) return 'past';
    if (d > lastSelectable.getTime() && !(normalizedStart && !normalizedEnd)) return 'tooFar';
    // 백엔드 기간 상한과 같은 범위다.
    if (maxRangeDays && normalizedStart && !normalizedEnd) {
      const maxEnd = new Date(normalizedStart);
      maxEnd.setDate(maxEnd.getDate() + maxRangeDays - 1);
      if (d > maxEnd.getTime()) return 'overRange';
    }
    return null;
  };

  const reasonTitle = {
    past: '지난 날짜예요',
    tooFar: `${MAX_MONTHS_AHEAD}개월 안의 날짜만 고를 수 있어요`,
    overRange: `여행은 최대 ${maxRangeDays}일까지 선택할 수 있어요`,
  } as const;

  const isInRange = (date: Date) => {
    if (!normalizedStart || !normalizedEnd) return false;
    const d = date.getTime();
    return d > normalizedStart.getTime() && d < normalizedEnd.getTime();
  };

  const monthIndex = year * 12 + month;
  const canGoPrev = monthIndex > effectiveMin.getFullYear() * 12 + effectiveMin.getMonth();
  const canGoNext = monthIndex < lastSelectable.getFullYear() * 12 + lastSelectable.getMonth()
    || (!!normalizedStart && !normalizedEnd && monthIndex < normalizedStart.getFullYear() * 12 + normalizedStart.getMonth() + 1);
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} disabled={!canGoPrev} className="p-2 min-w-[44px] min-h-[44px] rounded hover:bg-surface-hover text-foreground disabled:opacity-30 disabled:hover:bg-transparent" aria-label="이전 달">
          ‹
        </button>
        <span className="text-sm font-semibold text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={nextMonth} disabled={!canGoNext} className="p-2 min-w-[44px] min-h-[44px] rounded hover:bg-surface-hover text-foreground disabled:opacity-30 disabled:hover:bg-transparent" aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-semibold mb-1">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="py-1"
            style={{ color: i === 0 ? 'var(--calendar-sun)' : i === 6 ? 'var(--calendar-sat)' : 'var(--muted-2)' }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`e-${i}`} aria-hidden="true" />;
          const reason = disabledReason(date);
          const disabled = reason !== null;
          const isStart = normalizedStart && isSameDay(date, normalizedStart);
          const isEnd = normalizedEnd && isSameDay(date, normalizedEnd);
          const inRange = isInRange(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              title={reason ? reasonTitle[reason] : undefined}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${isStart ? ', 시작일' : ''}${isEnd ? ', 종료일' : ''}`}
              aria-pressed={Boolean(isStart || isEnd || inRange)}
              onClick={() => handleClick(date)}
              className={`
                py-2 text-sm rounded min-h-[36px] transition-colors
                ${reason === 'past' ? 'text-muted-2/70 line-through decoration-muted-2/50 cursor-not-allowed' : ''}
                ${reason === 'tooFar' || reason === 'overRange' ? 'bg-surface-3/60 text-muted-2 cursor-not-allowed' : ''}
                ${!disabled ? 'hover:bg-surface-hover cursor-pointer' : ''}
                ${isStart || isEnd ? 'bg-accent text-accent-fg font-semibold' : ''}
                ${inRange ? 'bg-accent-soft text-accent-weak-fg' : ''}
                ${!isStart && !isEnd && !inRange && !disabled ? 'text-foreground' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
