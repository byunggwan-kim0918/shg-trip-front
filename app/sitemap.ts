import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://shg-trip.cloud',
      lastModified: new Date('2026-06-03'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://shg-trip.cloud/login',
      lastModified: new Date('2026-06-03'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
