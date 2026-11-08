import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Car, ChevronRight, MapPin, Route, Wallet, BedDouble, Lightbulb } from 'lucide-react';
import PublicHeader, { PublicFooter } from '@/components/trips/PublicHeader';
import JsonLd from '@/components/trips/JsonLd';
import TripMap from '@/components/trips/TripMap';
import StartTripButton from '@/components/trips/StartTripButton';
import {
  getAllTrips,
  getTrip,
  getTripsByRegion,
  periodLabel,
  tripStats,
  SITE_URL,
  TRANSPORT_LABEL,
} from '@/lib/trips/content';
import { getRegion } from '@/lib/trips/regions';
import type { CuratedStop, CuratedTrip } from '@/lib/trips/types';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTrips().map((t) => ({ region: t.region, slug: t.slug }));
}

type Params = Promise<{ region: string; slug: string }>;

function describe(trip: CuratedTrip, regionName: string): string {
  const { totalKm } = tripStats(trip);
  const firstStops = trip.days.map((d) => `${d.day}일차 ${d.stops.filter((s) => s.kind !== '숙소').slice(0, 2).map((s) => s.name).join('·')}`);
  return `${regionName} ${periodLabel(trip.nights)} ${trip.themeLabel} 일정. ${firstStops.join(', ')}. 총 이동 ${totalKm}km, 시간·동선·예상 비용까지 하루별로 정리했습니다.`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { region, slug } = await params;
  const trip = getTrip(region, slug);
  const info = getRegion(region);
  if (!trip || !info) return {};
  const title = `${trip.title} | 하루별 동선·시간·예산 - SHG trip`;
  const description = describe(trip, info.name);
  const url = `${SITE_URL}/trips/${region}/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: trip.title, description, url, type: 'article', siteName: 'SHG trip', locale: 'ko_KR' },
    twitter: { card: 'summary_large_image', title: trip.title, description },
  };
}

const MOVE_LABEL: Record<string, string> = {
  CAR: '차로',
  WALK: '걸어서',
  BUS: '버스로',
  SUBWAY: '지하철로',
  TRAIN: '열차로',
  TAXI: '택시로',
};

function moveText(stop: CuratedStop, transport: CuratedTrip['transport']): string | null {
  if (!stop.move) return null;
  // 생성기는 대중교통 일정의 구간도 CAR로 남긴다.
  const label = stop.move.mode === 'CAR' && transport !== 'car' ? '대중교통·택시로' : MOVE_LABEL[stop.move.mode] ?? '이동';
  return `${label} ${stop.move.minutes}분 · ${stop.move.km}km`;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default async function TripPage({ params }: { params: Params }) {
  const { region, slug } = await params;
  const trip = getTrip(region, slug);
  const info = getRegion(region);
  if (!trip || !info) notFound();

  const { stopCount, totalKm, totalCost } = tripStats(trip);
  const period = periodLabel(trip.nights);
  const siblings = getTripsByRegion(region).filter((t) => t.slug !== slug);
  const url = `${SITE_URL}/trips/${region}/${slug}`;
  const sentence = `${info.name} ${period} ${trip.themeLabel} ${TRANSPORT_LABEL[trip.transport]} 여행`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '여행 코스', item: `${SITE_URL}/trips` },
        { '@type': 'ListItem', position: 2, name: `${info.name} 여행 코스`, item: `${SITE_URL}/trips/${region}` },
        { '@type': 'ListItem', position: 3, name: trip.title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: trip.title,
      description: trip.summary,
      url,
      touristType: trip.recommendedFor,
      itinerary: {
        '@type': 'ItemList',
        itemListElement: trip.days
          .flatMap((d) => d.stops)
          .map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'TouristAttraction', name: s.name, ...(s.address ? { address: s.address } : {}) },
          })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: trip.title,
      dateModified: trip.reviewedAt,
      author: { '@type': 'Organization', name: 'SHG trip', url: SITE_URL },
      mainEntityOfPage: url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: trip.faq.map((f) => ({
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

      <main className="mx-auto max-w-3xl px-5 pt-6 sm:px-8 sm:pt-10">
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-muted">
          <Link href="/trips" className="hover:text-foreground">여행 코스</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link href={`/trips/${region}`} className="hover:text-foreground">{info.name}</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-muted-2">{period}</span>
        </nav>

        <h1 className="mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-[36px]">
          {trip.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-2">{trip.summary}</p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-card-border bg-card-border sm:grid-cols-4">
          {[
            { icon: CalendarDays, label: '기간', value: period },
            { icon: Car, label: '이동 수단', value: TRANSPORT_LABEL[trip.transport] },
            { icon: Route, label: '총 이동', value: `${totalKm}km · ${stopCount}곳` },
            { icon: Wallet, label: `예상 비용 (${trip.partySize}인)`, value: won(totalCost) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card-bg px-4 py-3.5">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                <Icon size={13} aria-hidden="true" /> {label}
              </dt>
              <dd className="mt-1 text-[15px] font-extrabold tracking-[-0.02em] text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-6 rounded-2xl border border-card-border bg-card-bg p-5">
          <h2 className="text-sm font-extrabold text-foreground">이런 분께 추천해요</h2>
          <ul className="mt-2.5 space-y-1.5 text-[14px] text-text-2">
            {trip.recommendedFor.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <StartTripButton sentence={sentence} label="이 일정으로 내 여행 만들기" />
            <StartTripButton sentence={`${info.name} ${period} 여행`} label="내 조건으로 다시 짜기" variant="secondary" />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="sr-only">일정 지도</h2>
          <TripMap days={trip.days} />
        </section>

        {trip.days.map((d) => {
          const dayKm = Math.round(d.stops.reduce((sum, s) => sum + (s.move?.km ?? 0), 0));
          return (
            <section key={d.day} className="mt-10">
              <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">
                <span className="text-accent-weak-fg">{d.day}일차</span> · {d.title}
              </h2>
              <p className="mt-1 text-xs font-semibold text-muted">
                {d.stops.length}곳 · 이동 {dayKm}km · {d.stops[0]?.start}–{d.stops[d.stops.length - 1]?.end}
              </p>

              <ol className="mt-4 space-y-0">
                {d.stops.map((s, i) => {
                  const move = moveText(s, trip.transport);
                  return (
                    <li key={`${d.day}-${i}`}>
                      {move && (
                        <p className="ml-[68px] border-l-2 border-dashed border-divider py-2 pl-4 text-[12px] font-medium text-muted">
                          {move}
                        </p>
                      )}
                      <article className="flex gap-4">
                        <time className="w-[52px] shrink-0 pt-3.5 text-right text-[13px] font-bold tabular-nums text-foreground">
                          {s.start}
                        </time>
                        <div className="min-w-0 flex-1 rounded-xl border border-card-border bg-card-bg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[16px] font-extrabold tracking-[-0.02em] text-foreground">{s.name}</h3>
                            <span className="shrink-0 rounded-full bg-surface-3 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                              {s.kind}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[14px] leading-relaxed text-text-2">{s.note}</p>
                          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
                            <span>{s.start}–{s.end}</span>
                            {s.cost != null && s.cost > 0 && <span>예상 {won(s.cost)}</span>}
                            {s.address && (
                              <span className="flex items-center gap-1">
                                <MapPin size={11} aria-hidden="true" /> {s.address}
                              </span>
                            )}
                          </p>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {trip.lodgingArea && (
            <div className="rounded-2xl border border-card-border bg-card-bg p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
                <BedDouble size={15} aria-hidden="true" /> 숙소 권역
              </h2>
              <p className="mt-2 text-[14px] text-text-2">{trip.lodgingArea}</p>
            </div>
          )}
          <div className="rounded-2xl border border-card-border bg-card-bg p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
              <Lightbulb size={15} aria-hidden="true" /> 알아두면 좋은 점
            </h2>
            <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-text-2">
              {trip.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">자주 묻는 질문</h2>
          <div className="mt-4 divide-y divide-divider rounded-2xl border border-card-border bg-card-bg">
            {trip.faq.map((f) => (
              <div key={f.q} className="p-5">
                <h3 className="text-[15px] font-bold text-foreground">{f.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-text-2">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {siblings.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{info.name}의 다른 코스</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {siblings.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/trips/${region}/${t.slug}`}
                    className="block rounded-xl border border-card-border bg-card-bg p-4 transition-colors hover:bg-surface-hover"
                  >
                    <span className="text-[11px] font-bold text-accent-weak-fg">{periodLabel(t.nights)} · {t.themeLabel}</span>
                    <span className="mt-1 block text-[15px] font-extrabold text-foreground">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 rounded-2xl bg-accent-soft p-6 text-center">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-foreground">날짜와 취향만 바꿔서 내 일정으로</h2>
          <p className="mt-1.5 text-[14px] text-text-2">문장 하나면 AI가 동선·시간·예산까지 다시 짜드려요.</p>
          <div className="mt-4 flex justify-center">
            <StartTripButton sentence={sentence} label="이 일정으로 내 여행 만들기" />
          </div>
          <p className="mt-4 text-[11px] text-muted">
            <Link href={`/trips/${region}`} className="underline hover:text-foreground">{info.name} 여행 코스 전체 보기</Link>
            {' · '}검수일 {trip.reviewedAt}
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
