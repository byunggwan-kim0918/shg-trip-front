import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Car, Leaf } from 'lucide-react';
import PublicHeader, { PublicFooter } from '@/components/trips/PublicHeader';
import JsonLd from '@/components/trips/JsonLd';
import SentenceStart from '@/components/trips/SentenceStart';
import { getAllTrips, getTripsByRegion, periodLabel, tripStats, SITE_URL, TRANSPORT_LABEL } from '@/lib/trips/content';
import { REGIONS, getRegion } from '@/lib/trips/regions';

export const dynamicParams = false;

/** 코스가 하나도 없는 지역은 얇은 페이지라 만들지 않는다. */
export function generateStaticParams() {
  const withTrips = new Set(getAllTrips().map((t) => t.region));
  return REGIONS.filter((r) => withTrips.has(r.slug)).map((r) => ({ region: r.slug }));
}

type Params = Promise<{ region: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region } = await params;
  const info = getRegion(region);
  if (!info) return {};
  const periods = [...new Set(getTripsByRegion(region).map((t) => periodLabel(t.nights)))].join('·');
  const title = `${info.name} 여행 코스 추천 | ${periods} 일정 모음 - SHG trip`;
  const description = `${info.name} ${periods} 추천 코스를 기간과 테마별로 모았습니다. 권역별 동선, 이동 수단, 계절 팁까지 한 번에 확인하세요.`;
  const url = `${SITE_URL}/trips/${region}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${info.name} 여행 코스 추천`, description, url, type: 'website', siteName: 'SHG trip', locale: 'ko_KR' },
  };
}

export default async function RegionPage({ params }: { params: Params }) {
  const { region } = await params;
  const info = getRegion(region);
  const trips = getTripsByRegion(region);
  if (!info || trips.length === 0) notFound();

  const neighbors = info.neighbors.map(getRegion).filter((r) => r != null);
  const url = `${SITE_URL}/trips/${region}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '여행 코스', item: `${SITE_URL}/trips` },
        { '@type': 'ListItem', position: 2, name: `${info.name} 여행 코스`, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${info.name} 여행 코스 추천`,
      url,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: trips.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/trips/${region}/${t.slug}`,
          name: t.title,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: info.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-surface">
      <JsonLd data={jsonLd} />
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-5 pt-6 sm:px-8 sm:pt-10">
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-xs font-semibold text-muted">
          <Link href="/trips" className="hover:text-foreground">여행 코스</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-muted-2">{info.name}</span>
        </nav>

        <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-[40px]">
          {info.name} 여행 코스 추천
        </h1>
        <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-text-2">{info.intro}</p>

        <section className="mt-10">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">기간·테마별 코스</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => {
              const { totalKm, stopCount } = tripStats(t);
              return (
                <li key={t.slug}>
                  <Link
                    href={`/trips/${region}/${t.slug}`}
                    className="flex h-full flex-col rounded-2xl border border-card-border bg-card-bg p-5 transition-colors hover:bg-surface-hover"
                  >
                    <span className="text-xs font-bold text-accent-weak-fg">
                      {periodLabel(t.nights)} · {t.themeLabel}
                    </span>
                    <span className="mt-1.5 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-foreground">
                      {t.title}
                    </span>
                    <span className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-text-2">{t.summary}</span>
                    <span className="mt-auto pt-3 text-[12px] font-semibold text-muted">
                      {TRANSPORT_LABEL[t.transport]} · {stopCount}곳 · {totalKm}km
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{info.name} 권역 한눈에 보기</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {info.areas.map((a) => (
              <li key={a.name} className="rounded-xl border border-card-border bg-card-bg p-4">
                <h3 className="text-[15px] font-extrabold text-foreground">{a.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-text-2">{a.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-card-border bg-card-bg p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Car size={15} aria-hidden="true" /> 이동 수단
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-text-2">{info.transportNote}</p>
          </div>
          <div className="rounded-2xl border border-card-border bg-card-bg p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Leaf size={15} aria-hidden="true" /> 계절 팁
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-text-2">{info.seasonNote}</p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-accent-soft p-6">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-foreground">원하는 코스가 없나요?</h2>
          <p className="mt-1.5 text-[14px] text-text-2">날짜와 취향을 문장으로 적으면 {info.name} 일정을 새로 짜드려요.</p>
          <div className="mt-4 max-w-[560px]">
            <SentenceStart placeholder={`${info.name} 2박3일 맛집 위주로`} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-divider rounded-2xl border border-card-border bg-card-bg">
            {info.faq.map((f) => (
              <div key={f.q} className="p-5">
                <h3 className="text-[15px] font-bold text-foreground">{f.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-text-2">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {neighbors.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">함께 보면 좋은 지역</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {neighbors.map((n) => (
                <Link
                  key={n.slug}
                  href={`/trips/${n.slug}`}
                  className="rounded-full border border-card-border bg-card-bg px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-surface-hover"
                >
                  {n.name} 여행 코스
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
