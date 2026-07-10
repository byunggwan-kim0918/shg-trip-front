'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import CalendarPicker from '@/components/itinerary/wizard/CalendarPicker';
import FieldError from '@/components/common/FieldError';
import { POPULAR_DESTINATIONS, MAX_TRIP_DAYS } from '@/lib/constants/wizardOptions';
import { nightsLabel } from '@/lib/utils/tripStatus';

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 1단계: 여행지 · 기간 (6a). 검색 + 인기 칩 + 캘린더 범위. */
export default function TripBasicsStep() {
  const { data, updateData, nextStep, isStepValid } = useWizardStore();

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
        <p className="mt-1 text-[13.5px] text-muted">여행지와 날짜를 한 번에 정해요.</p>
      </div>

      {/* 여행지 검색 */}
      <div>
        <label className="flex h-[50px] items-center gap-2.5 rounded-[13px] border-[1.5px] border-accent bg-surface-3 px-4">
          <Search size={16} className="shrink-0 text-accent" aria-hidden="true" />
          <input
            type="text"
            value={data.destination}
            onChange={(e) => updateData({ destination: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && isStepValid) { e.preventDefault(); nextStep(); } }}
            placeholder="여행지를 입력하세요 (예: 제주도)"
            className="w-full bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-2"
            aria-label="여행지"
          />
        </label>
      </div>

      {/* 인기 목적지 칩 */}
      <div className="flex flex-wrap gap-[7px]">
        {POPULAR_DESTINATIONS.map((d) => {
          const active = data.destination.trim() === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => updateData({ destination: d })}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                active ? 'bg-accent text-white' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
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
          {durationText && <span className="text-[13px] font-bold text-accent">{durationText}</span>}
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

      {destEmpty && data.destination.length > 0 && <FieldError message="여행지는 필수 항목이에요." />}
    </div>
  );
}
