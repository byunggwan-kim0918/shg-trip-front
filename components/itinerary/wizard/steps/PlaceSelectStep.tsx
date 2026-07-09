'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useWizardStore } from '@/lib/stores/useWizardStore';
import { searchPlaces } from '@/lib/data/itineraryService';
import type { WizardPlace } from '@/lib/types/itinerary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PlaceMap = dynamic<{ places: WizardPlace[] }>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  () => import('@/components/itinerary/wizard/PlaceMap'),
  { ssr: false }
);

export default function PlaceSelectStep() {
  const { data, updateData, nextStep } = useWizardStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WizardPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // 검색 결과 없을 때 이름만으로 직접 추가 — 생성 시 백엔드가 Google 검색으로 실제 장소로 변환
  const MAX_CUSTOM_PLACES = 5;
  const customPlaceCount = data.selectedPlaces.filter((p) => p.id < 0).length;

  const addCustomPlace = () => {
    const name = query.trim();
    if (!name) return;
    if (customPlaceCount >= MAX_CUSTOM_PLACES) return; // 버튼 비활성화와 이중 방어
    const custom: WizardPlace = {
      id: -(Date.now()),  // 음수 임시 ID — 생성 요청 시 customPlaceNames(이름)로 전달됨
      name,
      address: '',
      latitude: 0,
      longitude: 0,
      category: 'attraction',
    };
    addPlace(custom);
  };

  const removePlace = (id: number) => {
    updateData({ selectedPlaces: data.selectedPlaces.filter((p) => p.id !== id) });
  };

  const hasNoResults = !isSearching && query.trim().length > 0 && results.length === 0;
  const mappablePlaces = data.selectedPlaces.filter((p) => p.latitude !== 0 && p.longitude !== 0);

  // 선택 장소들이 서로 다른 지역에 걸쳐 있으면 경고 (region이 있는 장소만 대상).
  // 여행지-장소 최종 검증은 백엔드(enrich regions 기준)가 담당하고, 여기선 즉각적인 힌트만 제공.
  const selectedRegions = Array.from(
    new Set(data.selectedPlaces.map((p) => p.region).filter((r): r is string => !!r)),
  );
  const hasMixedRegions = selectedRegions.length > 1;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">장소 선택</h2>
      <p className="text-sm text-muted">가고 싶은 장소를 검색하거나 직접 입력하세요 (1개 이상)</p>

      <div className="rounded-lg overflow-hidden border border-card-border" style={{ height: '220px' }}>
        <Suspense fallback={
          <div className="w-full h-full bg-surface flex items-center justify-center text-muted text-sm">
            지도 불러오는 중...
          </div>
        }>
          <PlaceMap places={mappablePlaces} />
        </Suspense>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (hasNoResults) addCustomPlace();
              else if (!query.trim()) nextStep();
            }}
            placeholder="장소 검색 또는 직접 입력..."
            className="flex-1 px-4 py-3 rounded-lg border border-card-border bg-card-bg text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
          />
          {hasNoResults && (
            <button
              type="button"
              onClick={addCustomPlace}
              disabled={customPlaceCount >= MAX_CUSTOM_PLACES}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors min-h-[44px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              직접 추가
            </button>
          )}
        </div>

        {isSearching && <p className="mt-1 text-xs text-muted">검색 중...</p>}
        {hasNoResults && (
          <p className="mt-1 text-xs text-muted">
            {customPlaceCount >= MAX_CUSTOM_PLACES
              ? `직접 입력은 최대 ${MAX_CUSTOM_PLACES}개까지 가능합니다`
              : '직접 입력한 장소는 일정 생성 시 실제 장소로 검색됩니다'}
          </p>
        )}

        {results.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-card-border bg-card-bg shadow-lg">
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => addPlace(place)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{place.name}</p>
                    {place.region && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-soft text-accent shrink-0">
                        {place.region}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{place.address}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasNoResults && (
          <p className="mt-1 text-xs text-muted">
            검색 결과가 없습니다. &quot;직접 추가&quot; 버튼으로 추가하거나 Enter를 누르세요.
          </p>
        )}
      </div>

      {hasMixedRegions && (
        <p className="text-xs text-danger">
          ⚠️ 선택한 장소가 여러 지역({selectedRegions.join(', ')})에 걸쳐 있습니다. 여행지와 다른 지역의 장소는 일정 생성 시 거부될 수 있습니다.
        </p>
      )}

      {data.selectedPlaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.selectedPlaces.map((place) => (
            <span
              key={place.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-sm"
            >
              {place.name}
              {place.region && <span className="text-xs opacity-60">· {place.region}</span>}
              {place.latitude === 0 && <span className="text-xs opacity-60">(직접입력)</span>}
              <button
                type="button"
                onClick={() => removePlace(place.id)}
                className="ml-1 hover:text-danger min-w-[20px] min-h-[20px]"
                aria-label={`${place.name} 제거`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
