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

  const handleClick = (date: Date) => {
    if (!normalizedStart || (normalizedStart && normalizedEnd)) {
      onDateChange(date, null);
    } else {
      if (date.getTime() < normalizedStart.getTime()) {
        onDateChange(date, null);
      } else {
        onDateChange(normalizedStart, date);
      }
    }
  };

  const isDisabled = (date: Date) => {
    const d = date.getTime();
    if (d < effectiveMin.getTime()) return true;
    if (normalizedStart && !normalizedEnd && d < normalizedStart.getTime()) return true;
    // 종료일 선택 중: 시작일 + (maxRangeDays-1)일을 넘는 날짜는 비활성 (백엔드 상한과 동일)
    if (maxRangeDays && normalizedStart && !normalizedEnd) {
      const maxEnd = new Date(normalizedStart);
      maxEnd.setDate(maxEnd.getDate() + maxRangeDays - 1);
      if (d > maxEnd.getTime()) return true;
    }
    return false;
  };

  const isInRange = (date: Date) => {
    if (!normalizedStart || !normalizedEnd) return false;
    const d = date.getTime();
    return d > normalizedStart.getTime() && d < normalizedEnd.getTime();
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-2 min-w-[44px] min-h-[44px] rounded hover:bg-surface-hover text-foreground" aria-label="이전 달">
          ‹
        </button>
        <span className="text-sm font-semibold text-foreground">{year}년 {month + 1}월</span>
        <button type="button" onClick={nextMonth} className="p-2 min-w-[44px] min-h-[44px] rounded hover:bg-surface-hover text-foreground" aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted mb-1">
        {DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;
          const disabled = isDisabled(date);
          const isStart = normalizedStart && isSameDay(date, normalizedStart);
          const isEnd = normalizedEnd && isSameDay(date, normalizedEnd);
          const inRange = isInRange(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleClick(date)}
              className={`
                py-2 text-sm rounded min-h-[36px] transition-colors
                ${disabled ? 'text-muted/40 cursor-not-allowed' : 'hover:bg-surface-hover cursor-pointer'}
                ${isStart || isEnd ? 'bg-accent text-white font-semibold' : ''}
                ${inRange ? 'bg-accent-soft text-accent' : ''}
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
