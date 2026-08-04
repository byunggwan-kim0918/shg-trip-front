'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import StatusDot from '@/components/common/StatusDot';
import { displayStatus, dateRange } from '@/lib/utils/tripStatus';

const MAX_RESULTS = 8;

/** 헤더 여행 검색. itineraries 스토어 클라이언트 필터 + 드롭다운. */
export default function HeaderSearch() {
  const router = useRouter();
  const { itineraries, loadItineraries } = useItineraryStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 검색 소스 보장: 목록이 비었으면 로드(헤더 단독 화면 대비 — Sidebar만 로드를 호출하므로).
  // store가 in-flight 가드를 하므로 Sidebar 호출과 중복되지 않는다. rejection은 삼킨다.
  const triedLoad = useRef(false);
  useEffect(() => {
    if (itineraries.length === 0 && !triedLoad.current) {
      triedLoad.current = true;
      void loadItineraries().catch(() => {});
    }
  }, [itineraries.length, loadItineraries]);

  // 외부 클릭 닫기
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return itineraries
      .filter((it) =>
        (it.title ?? '').toLowerCase().includes(q) || it.destination.toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [query, itineraries]);

  const go = (id: number) => {
    setOpen(false);
    setQuery('');
    router.push(`/main/itinerary/${id}`);
  };

  return (
    <div ref={boxRef} className="relative max-w-[360px] flex-1">
      <label className="flex h-9 items-center gap-2 rounded-[10px] border border-transparent bg-surface-3 px-3 transition-colors focus-within:border-accent">
        <Search size={14} className="shrink-0 text-muted-2" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
            if (e.key === 'Enter' && results[0]) go(results[0].id);
          }}
          placeholder="여행 검색"
          className="w-full bg-transparent text-[13.5px] text-text-2 outline-none placeholder:text-muted-2"
          aria-label="여행 검색"
        />
      </label>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-muted-2">일치하는 여행이 없어요.</p>
          ) : (
            <ul>
              {results.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => go(it.id)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover"
                  >
                    <StatusDot status={displayStatus(it)} showLabel={false} size={8} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[13.5px] font-semibold text-foreground">
                        {it.title ?? it.destination}
                      </span>
                      <span className="truncate text-[11.5px] text-muted-2">
                        {it.destination} · {dateRange(it.startDate, it.endDate)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
