'use client';

import { useMemo, useState } from 'react';
import MapPanel from '@/components/itinerary/result/MapPanel';
import type { ItineraryStep } from '@/lib/types/itinerary';
import type { CuratedDay } from '@/lib/trips/types';

/** MapPanel은 ItineraryStep을 받으므로 지도에 필요한 필드만 채워 넘긴다. */
function toMapSteps(days: CuratedDay[]): ItineraryStep[] {
  let id = 0;
  return days.flatMap((d) =>
    d.stops.map((s) => {
      id += 1;
      return {
        id,
        stepOrder: id,
        dayNumber: d.day,
        startTime: s.start,
        endTime: s.end,
        place:
          s.lat != null && s.lng != null
            ? {
                id,
                name: s.name,
                address: s.address ?? '',
                latitude: s.lat,
                longitude: s.lng,
                category: s.kind,
                region: null,
                country: null,
                rating: null,
                priceLevel: null,
                openingHours: null,
                imageUrl: s.imageUrl,
              }
            : null,
        transportationMode: null,
        transportationDuration: s.move?.minutes ?? null,
        transportationDistance: s.move?.km ?? null,
        transportationCost: null,
        notes: s.note,
        userNotes: null,
        estimatedCost: s.cost,
        alternatives: [],
      };
    }),
  );
}

export default function TripMap({ days }: { days: CuratedDay[] }) {
  const steps = useMemo(() => toMapSteps(days), [days]);
  const [day, setDay] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card-bg">
      <div className="flex gap-1.5 overflow-x-auto border-b border-card-border px-3 py-2.5">
        {[undefined, ...days.map((d) => d.day)].map((d) => (
          <button
            key={d ?? 'all'}
            type="button"
            onClick={() => {
              setDay(d);
              setSelected(null);
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              day === d ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-muted hover:text-foreground'
            }`}
          >
            {d == null ? '전체' : `${d}일차`}
          </button>
        ))}
      </div>
      <div className="h-[280px] sm:h-[380px]">
        <MapPanel steps={steps} selectedDay={day} selectedStepId={selected} onMarkerClick={setSelected} />
      </div>
    </div>
  );
}
