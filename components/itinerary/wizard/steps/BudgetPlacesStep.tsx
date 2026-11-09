'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { searchPlaces } from '@/lib/data/itineraryService';
import { formatBudget, parseBudget } from '@/lib/utils/format';
import { BUDGET_QUICK_CHIPS, MAX_BUDGET, MAX_CUSTOM_PLACES } from '@/lib/constants/wizardOptions';
import type { WizardPlace } from '@/lib/types/itinerary';
import { MANUAL_PLACE_NAME_MAX_LENGTH } from '@/lib/constants/newTrip';

/** 숙박 1박 기본 단가(ScheduleTuning.LODGING_HOTEL_DEFAULT_WON)보다 적으면 일정 하나도 맞추기 어렵다. */
const LOW_BUDGET_WARNING = 120_000;

/** 띄어쓰기만 다른 이름(성산일출봉 / 성산 일출봉)을 같은 장소로 본다. */
const compactName = (name: string) => name.replace(/\s+/g, '');

export default function BudgetPlacesStep() {
  const { data, updateData } = useWizardStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WizardPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  // budget=null은 "미입력"과 "상관없음"을 둘 다 뜻하므로
  // 사용자가 예산을 만졌을 때만 "상관없음" 칩을 활성 표시한다.
  const [budgetTouched, setBudgetTouched] = useState(data.budget !== null);
  const [budgetHint, setBudgetHint] = useState<string | null>(null);

  const budgetDisplay = data.budget ? formatBudget(data.budget) : '';

  const handleBudgetChange = (raw: string) => {
    setBudgetTouched(true);
    const normalized = raw
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/\s+/g, '')
      .replace(/원$/, '');
    // 붙여넣은 "50만"은 받는다. 입력칸이 숫자 자판이라 직접 칠 때는 숫자만 들어온다.
    const manMatch = /^([\d,]+)만$/.exec(normalized);
    // 숫자 외 문자를 버리고 남은 숫자만 쓰면 1e5 → 15, -5000 → 5000처럼 조용히 다른 값이 된다
    if (!manMatch && /[^0-9,]/.test(normalized)) {
      setBudgetHint('숫자만 입력할 수 있어요.');
      return;
    }
    const digits = (manMatch ? manMatch[1] : normalized).replace(/[^0-9]/g, '');
    const value = digits ? parseBudget(digits) * (manMatch ? 10_000 : 1) : 0;
    const parsed = value > 0 ? value : null;
    if (parsed !== null && parsed > MAX_BUDGET) {
      setBudgetHint(`최대 ${formatBudget(MAX_BUDGET)}원까지 입력할 수 있어요.`);
      updateData({ budget: MAX_BUDGET });
      return;
    }
    setBudgetHint(null);
    updateData({ budget: parsed });
  };

  // 입력 중에는 5 → 50 → 500처럼 작은 값을 거치므로 칸을 떠날 때만 알린다.
  const warnIfLowBudget = () => {
    if (data.budget !== null && data.budget < LOW_BUDGET_WARNING) {
      setBudgetHint(`${formatBudget(data.budget)}원은 숙박비만으로도 넘을 수 있어요. 일행 전체 예산인지 확인해 주세요.`);
    }
  };

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearchFailed(false); return; }
    setIsSearching(true);
    try {
      const places = await searchPlaces(q);
      setResults(places.filter((p) => !data.selectedPlaces.some((sp) => sp.id === p.id)));
      setSearchFailed(false);
    } catch {
      setResults([]);
      setSearchFailed(true);
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
  const hasNoResults = !isSearching && !searchFailed && query.trim().length > 0 && results.length === 0;
  const isDuplicateName = data.selectedPlaces.some((p) => compactName(p.name) === compactName(query));

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
        <span className="text-xs font-bold text-muted-2">선택 사항</span>
      </div>
      <p className="-mt-3 text-[13px] text-muted">비워두면 알아서 채워요.</p>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-xs font-bold tracking-[0.03em] text-muted-2">예산</span>
          <span className="text-xs text-muted-2">일행 전체 · 숙박 포함</span>
        </div>
        <label className="mb-2 flex h-12 items-center rounded-lg border border-card-border bg-surface-3 px-4 focus-within:ring-2 focus-within:ring-accent/25">
          <input
            type="text"
            inputMode="numeric"
            value={budgetDisplay}
            onChange={(e) => handleBudgetChange(e.target.value)}
            onBlur={warnIfLowBudget}
            placeholder="0"
            className="flex-1 bg-transparent text-base font-bold sm:text-[15px] text-foreground outline-none placeholder:font-normal placeholder:text-muted-2"
            aria-label="예산"
          />
          <span className="text-sm font-semibold text-muted-2">원</span>
        </label>
        {budgetHint && <p className="-mt-1 mb-2 text-xs text-warn-fg" role="status">{budgetHint}</p>}
        <div className="flex gap-1.5">
          {BUDGET_QUICK_CHIPS.map((chip) => {
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
                // 한글 조합 중 Enter는 조합 확정이라, 제출로 처리하면 입력창을 비운 뒤
                // 잔여 조합("성산일출봉"의 "봉")이 다시 채워져 칩이 두 개 생긴다.
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && hasNoResults) { e.preventDefault(); addCustomPlace(); }
              }}
              maxLength={MANUAL_PLACE_NAME_MAX_LENGTH}
              placeholder="장소 검색 (예: 성산일출봉)"
              className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-2 sm:text-[13px]"
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
        {searchFailed && !isSearching && query.trim() && (
          <p className="mt-1.5 text-xs font-semibold text-danger" role="alert">장소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
        )}
        {hasNoResults && !isSearching && (
          <p className="mt-1.5 text-xs text-muted-2">
            {customPlaceCount >= MAX_CUSTOM_PLACES
              ? `직접 입력은 ${MAX_CUSTOM_PLACES}개까지 넣을 수 있어요`
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
                      <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-xs text-accent-weak-fg">
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

      {data.selectedPlaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.selectedPlaces.map((place) => (
            <span
              key={place.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-weak-fg"
            >
              <span className="min-w-0 truncate" title={place.name}>{place.name}</span>
              {place.latitude === 0 && <span className="shrink-0 whitespace-nowrap text-xs opacity-70">(직접입력)</span>}
              <button
                type="button"
                onClick={() => removePlace(place.id)}
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
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
