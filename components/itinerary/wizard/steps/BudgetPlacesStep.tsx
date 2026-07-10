'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { searchPlaces } from '@/lib/data/itineraryService';
import { formatBudget, parseBudget } from '@/lib/utils/format';
import { BUDGET_QUICK_CHIPS, MAX_BUDGET, MAX_CUSTOM_PLACES } from '@/lib/constants/wizardOptions';
import type { WizardPlace } from '@/lib/types/itinerary';

/** 4단계: 예산 · 필수 장소 (6d) — 선택 · 건너뛰기 가능. */
export default function BudgetPlacesStep() {
  const { data, updateData } = useWizardStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WizardPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // budget=null은 "미입력"과 "상관없음" 둘 다를 의미해 애매하다.
  // 사용자가 예산을 명시적으로 만졌을 때만 null-칩("상관없음")을 활성 표시한다.
  const [budgetTouched, setBudgetTouched] = useState(data.budget !== null);

  const budgetDisplay = data.budget ? formatBudget(data.budget) : '';

  const handleBudgetChange = (raw: string) => {
    setBudgetTouched(true);
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed = digits ? parseBudget(digits) : null;
    updateData({ budget: parsed !== null ? Math.min(parsed, MAX_BUDGET) : null });
  };

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try {
      const places = await searchPlaces(q);
      setResults(places.filter((p) => !data.selectedPlaces.some((sp) => sp.id === p.id)));
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [data.selectedPlaces]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const addPlace = (place: WizardPlace) => {
    updateData({ selectedPlaces: [...data.selectedPlaces, place] });
    setQuery('');
    setResults([]);
  };

  const customPlaceCount = data.selectedPlaces.filter((p) => p.id < 0).length;
  const hasNoResults = !isSearching && query.trim().length > 0 && results.length === 0;

  // 검색 결과 없을 때 이름만으로 직접 추가 — 생성 시 백엔드가 Google 검색으로 실제 장소로 변환
  const addCustomPlace = () => {
    const name = query.trim();
    if (!name || customPlaceCount >= MAX_CUSTOM_PLACES) return;
    addPlace({ id: -(Date.now()), name, address: '', latitude: 0, longitude: 0, category: 'attraction' });
  };

  const removePlace = (id: number) => {
    updateData({ selectedPlaces: data.selectedPlaces.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[23px] font-extrabold tracking-[-0.02em] text-foreground">예산 · 필수 장소</h2>
        <span className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-bold text-muted-2">선택 · 건너뛰기</span>
      </div>
      <p className="-mt-3 text-[13.5px] text-muted">비워두면 AI가 알아서 채워요.</p>

      {/* 예산 */}
      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">예산</div>
        <label className="mb-2 flex h-12 items-center rounded-xl border border-card-border bg-surface-3 px-4">
          <input
            type="text"
            inputMode="numeric"
            value={budgetDisplay}
            onChange={(e) => handleBudgetChange(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-[15.5px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-2"
            aria-label="예산"
          />
          <span className="text-sm font-semibold text-muted-2">원</span>
        </label>
        <div className="flex gap-[7px]">
          {BUDGET_QUICK_CHIPS.map((chip) => {
            // null 칩(상관없음)은 사용자가 예산을 만졌을 때만 활성으로 간주
            const active = chip.value === null ? budgetTouched && data.budget === null : data.budget === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => { setBudgetTouched(true); updateData({ budget: chip.value }); }}
                className={`rounded-full px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                  active ? 'bg-accent text-white' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 필수 장소 */}
      <div className="relative">
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">꼭 가고 싶은 장소</div>
        <div className="flex gap-2">
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-[11px] border border-card-border bg-surface-3 px-3.5">
            <Search size={15} className="shrink-0 text-muted-2" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && hasNoResults) { e.preventDefault(); addCustomPlace(); } }}
              placeholder="장소 검색 (예: 성산일출봉)"
              className="w-full bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-2"
              aria-label="장소 검색"
            />
          </label>
          {hasNoResults && (
            <button
              type="button"
              onClick={addCustomPlace}
              disabled={customPlaceCount >= MAX_CUSTOM_PLACES}
              className="shrink-0 rounded-[11px] bg-accent px-4 text-[13px] font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              직접 추가
            </button>
          )}
        </div>

        {isSearching && <p className="mt-1.5 text-xs text-muted-2">검색 중...</p>}
        {hasNoResults && !isSearching && (
          <p className="mt-1.5 text-xs text-muted-2">
            {customPlaceCount >= MAX_CUSTOM_PLACES
              ? `직접 입력은 최대 ${MAX_CUSTOM_PLACES}개까지 가능합니다`
              : '직접 입력한 장소는 생성 시 실제 장소로 검색돼요'}
          </p>
        )}

        {results.length > 0 && (
          <ul className="absolute z-10 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-card-border bg-card-bg shadow-lg">
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => addPlace(place)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{place.name}</span>
                    {place.region && (
                      <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent-weak-fg">
                        {place.region}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-2">{place.address}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 선택된 장소 칩 */}
      {data.selectedPlaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.selectedPlaces.map((place) => (
            <span
              key={place.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-weak-fg"
            >
              {place.name}
              {place.latitude === 0 && <span className="text-[11px] opacity-70">(직접입력)</span>}
              <button
                type="button"
                onClick={() => removePlace(place.id)}
                className="opacity-60 transition-opacity hover:opacity-100"
                aria-label={`${place.name} 제거`}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
