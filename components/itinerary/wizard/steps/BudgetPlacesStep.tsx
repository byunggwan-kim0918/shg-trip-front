'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { searchPlaces } from '@/lib/data/itineraryService';
import { formatBudget, parseBudget } from '@/lib/utils/format';
import { BUDGET_QUICK_CHIPS, MAX_BUDGET, MAX_CUSTOM_PLACES } from '@/lib/constants/wizardOptions';
import type { WizardPlace } from '@/lib/types/itinerary';
import { MANUAL_PLACE_NAME_MAX_LENGTH } from '@/lib/constants/newTrip';

/** 4단계: 예산 · 필수 장소 (6d) — 선택 · 건너뛰기 가능. */
export default function BudgetPlacesStep() {
  const { data, updateData } = useWizardStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WizardPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // budget=null은 "미입력"과 "상관없음" 둘 다를 의미해 애매하다.
  // 사용자가 예산을 명시적으로 만졌을 때만 null-칩("상관없음")을 활성 표시한다.
  const [budgetTouched, setBudgetTouched] = useState(data.budget !== null);
  const [budgetHint, setBudgetHint] = useState<string | null>(null);

  const budgetDisplay = data.budget ? formatBudget(data.budget) : '';

  const handleBudgetChange = (raw: string) => {
    setBudgetTouched(true);
    // 숫자 외 문자를 버리고 남은 숫자만 쓰면 1e5 → 15, -5000 → 5000처럼 조용히 다른 값이 된다
    if (/[^0-9,\s]/.test(raw)) {
      setBudgetHint('숫자만 입력할 수 있어요.');
      return;
    }
    const digits = raw.replace(/[^0-9]/g, '');
    const parsed = digits ? parseBudget(digits) : null;
    if (parsed !== null && parsed > MAX_BUDGET) {
      setBudgetHint(`최대 ${formatBudget(MAX_BUDGET)}원까지 입력할 수 있어요.`);
      updateData({ budget: MAX_BUDGET });
      return;
    }
    setBudgetHint(null);
    updateData({ budget: parsed });
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
  const isDuplicateName = data.selectedPlaces.some((p) => p.name.trim() === query.trim());

  // 검색 결과가 없을 때 이름만으로 추가한다. 백엔드가 저장된 장소에서 이름으로 찾고, 못 찾으면 뺀다
  const addCustomPlace = () => {
    const name = query.trim();
    if (!name || customPlaceCount >= MAX_CUSTOM_PLACES || isDuplicateName) return;
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
      <p className="-mt-3 text-[13px] text-muted">비워두면 AI가 알아서 채워요.</p>

      {/* 예산 */}
      <div>
        <div className="mb-2.5 text-xs font-bold tracking-[0.03em] text-muted-2">예산</div>
        <label className="mb-2 flex h-12 items-center rounded-lg border border-card-border bg-surface-3 px-4 focus-within:ring-2 focus-within:ring-accent/25">
          <input
            type="text"
            inputMode="numeric"
            value={budgetDisplay}
            onChange={(e) => handleBudgetChange(e.target.value)}
            placeholder="0"
            className="flex-1 bg-transparent text-[15px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-2"
            aria-label="예산"
          />
          <span className="text-sm font-semibold text-muted-2">원</span>
        </label>
        {budgetHint && <p className="-mt-1 mb-2 text-xs text-warn-fg" role="status">{budgetHint}</p>}
        <div className="flex gap-1.5">
          {BUDGET_QUICK_CHIPS.map((chip) => {
            // null 칩(상관없음)은 사용자가 예산을 만졌을 때만 활성으로 간주
            const active = chip.value === null ? budgetTouched && data.budget === null : data.budget === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => { setBudgetTouched(true); setBudgetHint(null); updateData({ budget: chip.value }); }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-text-2 hover:bg-surface-hover'
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
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-lg border border-card-border bg-surface-3 px-3.5 focus-within:ring-2 focus-within:ring-accent/25">
            <Search size={15} className="shrink-0 text-muted-2" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // 한글 조합 중 Enter는 "조합 확정"용 — 제출로 처리하면 입력창을 비운 뒤
                // 잔여 조합("성산일출봉"의 "봉")이 다시 채워져 칩이 두 개 생긴다.
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && hasNoResults) { e.preventDefault(); addCustomPlace(); }
              }}
              maxLength={MANUAL_PLACE_NAME_MAX_LENGTH}
              placeholder="장소 검색 (예: 성산일출봉)"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-2"
              aria-label="장소 검색"
            />
          </label>
          {hasNoResults && (
            <button
              type="button"
              onClick={addCustomPlace}
              disabled={customPlaceCount >= MAX_CUSTOM_PLACES || isDuplicateName}
              className="shrink-0 rounded-[10px] bg-accent px-4 text-[13px] font-bold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
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
              : isDuplicateName
                ? '이미 추가한 장소예요'
                : '직접 입력한 장소는 이름으로 찾아 넣어요. 못 찾으면 빠질 수 있어요'}
          </p>
        )}

        {results.length > 0 && (
          <ul className="absolute z-10 mt-1.5 max-h-60 w-full overflow-y-auto rounded-[10px] border border-card-border bg-card-bg shadow-lg">
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
                      <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent-weak-fg">
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
              className="inline-flex max-w-full items-center gap-1.5 break-all rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-weak-fg"
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
