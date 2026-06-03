export async function GET() {
  const text = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /main/
Disallow: /onboarding/
Disallow: /callback/

Sitemap: https://shg-trip.cloud/sitemap.xml
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
