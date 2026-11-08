import fs from 'node:fs';
import path from 'node:path';
import type { CuratedTrip } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'trips');

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://myshgtrip.com';

export const TRANSPORT_LABEL: Record<string, string> = { car: '렌터카', transit: '대중교통', walk: '도보' };

export function getAllTrips(): CuratedTrip[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      fs
        .readdirSync(path.join(CONTENT_DIR, d.name))
        .filter((f) => f.endsWith('.json'))
        .map((f) => JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, d.name, f), 'utf8')) as CuratedTrip),
    )
    .sort((a, b) => a.region.localeCompare(b.region) || a.nights - b.nights || a.slug.localeCompare(b.slug));
}

export function getTripsByRegion(region: string): CuratedTrip[] {
  return getAllTrips().filter((t) => t.region === region);
}

export function getTrip(region: string, slug: string): CuratedTrip | undefined {
  return getAllTrips().find((t) => t.region === region && t.slug === slug);
}

export function periodLabel(nights: number): string {
  return nights === 0 ? '당일치기' : `${nights}박${nights + 1}일`;
}

export function tripStats(trip: CuratedTrip) {
  const stops = trip.days.flatMap((d) => d.stops);
  const km = stops.reduce((sum, s) => sum + (s.move?.km ?? 0), 0);
  const cost = stops.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  return { stopCount: stops.length, totalKm: Math.round(km), totalCost: cost };
}
