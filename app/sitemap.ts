import type { MetadataRoute } from 'next';
import { getAllTrips, SITE_URL } from '@/lib/trips/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const trips = getAllTrips();
  const regions = [...new Set(trips.map((t) => t.region))];
  const latest = (list: { reviewedAt: string }[]) =>
    new Date(list.map((t) => t.reviewedAt).sort().at(-1) ?? '2026-11-08');

  return [
    {
      url: SITE_URL,
      lastModified: new Date('2026-06-03'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date('2026-06-03'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: `${SITE_URL}/trips`, lastModified: latest(trips), changeFrequency: 'weekly', priority: 0.9 },
    ...regions.map((r) => ({
      url: `${SITE_URL}/trips/${r}`,
      lastModified: latest(trips.filter((t) => t.region === r)),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...trips.map((t) => ({
      url: `${SITE_URL}/trips/${t.region}/${t.slug}`,
      lastModified: new Date(t.reviewedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
