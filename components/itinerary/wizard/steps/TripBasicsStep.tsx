'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { useWizardStore, isSameDayTimeInverted } from '@/lib/stores/useWizardStore';
import CalendarPicker from '@/components/itinerary/wizard/CalendarPicker';
import FieldError from '@/components/common/FieldError';
import { POPULAR_DESTINATIONS, MAX_TRIP_DAYS } from '@/lib/constants/wizardOptions';
import { nightsLabel } from '@/lib/utils/tripStatus';
import { DESTINATION_MAX_LENGTH } from '@/lib/constants/newTrip';

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 도착·출발 시각 한 줄. 비우면 null(모름). */
function TimeField({ label, value, onChange }: {
  label: string; value: string | null; onChange: (v: string | null) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-lg bg-surface-3 px-3.5">
      <span className="text-[13px] font-semibold text-text-2">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="time"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-w-[6rem] bg-transparent text-right text-[15px] font-bold text-foreground outline-none"
          aria-label={label}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(null); }}
            aria-label={`${label} 지우기`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-2 hover:bg-surface-hover"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </span>
    </label>
  );
}

/** 1단계: 여행지 · 기간 (6a). 검색 + 인기 칩 + 캘린더 범위 + 도착·출발 시간(선택, 접힘). */
export default function TripBasicsStep() {
  const { data, updateData, nextStep, isStepValid } = useWizardStore();
  const [timesOpen, setTimesOpen] = useState(Boolean(data.arrivalTime || data.departureTime));

  const startDate = data.startDate ? new Date(data.startDate) : null;
  const endDate = data.endDate ? new Date(data.endDate) : null;
  const durationText = useMemo(
    () => (data.startDate && data.endDate ? nightsLabel(data.startDate, data.endDate) : null),
    [data.startDate, data.endDate],
  );

  const handleDateChange = (start: Date | null, end: Date | null) => {
    updateData({
      startDate: start ? toLocalDateStr(start) : null,
      endDate: end ? toLocalDateStr(end) : null,
    });
  };

  const destEmpty = data.destination.trim().length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">어디로, 언제 떠나세요?</h2>
        <p className="mt-1 text-[13px] text-muted">여행지와 날짜를 한 번에 정해요.</p>
      </div>

      {/* 여행지 검색 */}
      <div>
        <label className="flex h-[50px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-accent bg-surface-3 px-4 focus-within:ring-2 focus-within:ring-accent/25">
          <Search size={16} className="shrink-0 text-accent-weak-fg" aria-hidden="true" />
          <input
            type="text"
            value={data.destination}
            onChange={(e) => updateData({ destination: e.target.value })}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && isStepValid) { e.preventDefault(); nextStep(); }
            }}
            maxLength={DESTINATION_MAX_LENGTH}
            placeholder="여행지를 입력하세요 (예: 제주도)"
            className="w-full bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-2"
            aria-label="여행지"
          />
        </label>
      </div>

      {/* 인기 목적지 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_DESTINATIONS.map((d) => {
          const active = data.destination.trim() === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => updateData({ destination: d })}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                active ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* 기간 */}
      <div className="pt-1">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[15px] font-bold text-foreground">여행 기간</span>
          {durationText && <span className="text-[13px] font-bold text-accent-weak-fg">{durationText}</span>}
        </div>
        <CalendarPicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          maxRangeDays={MAX_TRIP_DAYS}
        />
        {!data.startDate && (
          <p className="mt-2 text-xs text-muted-2">시작일과 종료일을 선택하세요 (최대 {MAX_TRIP_DAYS}일).</p>
        )}
      </div>

      {/* 도착·출발 시간 (선택) */}
      <div>
        <button
          type="button"
          onClick={() => setTimesOpen((v) => !v)}
          aria-expanded={timesOpen}
          className="flex w-full items-center justify-between py-1 text-left"
        >
          <span className="text-[13px] font-semibold text-text-2">
            도착·출발 시간 <span className="font-normal text-muted-2">(선택)</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-2">
            {!timesOpen && (data.arrivalTime || data.departureTime)
              ? [data.arrivalTime && `${data.arrivalTime} 도착`, data.departureTime && `${data.departureTime} 출발`]
                  .filter(Boolean).join(' · ')
              : null}
            <ChevronDown size={15} className={`transition-transform ${timesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </span>
        </button>
        {timesOpen && (
          <div className="mt-2 space-y-2">
            <TimeField label="첫날 도착" value={data.arrivalTime} onChange={(v) => updateData({ arrivalTime: v })} />
            <TimeField label="마지막 날 출발" value={data.departureTime} onChange={(v) => updateData({ departureTime: v })} />
            {isSameDayTimeInverted(data)
              ? <FieldError message="당일 여행은 출발 시간이 도착 시간보다 늦어야 해요." />
              : <p className="text-xs text-muted-2">비행기·기차 시간을 넣으면 첫날과 마지막 날 일정을 거기에 맞춰요.</p>}
          </div>
        )}
      </div>

      {destEmpty && data.destination.length > 0 && <FieldError message="여행지는 필수 항목이에요." />}
    </div>
  );
}
