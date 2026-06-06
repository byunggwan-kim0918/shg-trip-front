import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/main/', '/onboarding/', '/callback/'],
    },
    sitemap: 'https://shg-trip.cloud/sitemap.xml',
  };
}
