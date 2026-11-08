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
import type { TransportType } from '@/lib/types/itinerary';
import TransitInfo from '@/components/itinerary/result/TransitInfo';
import { getCategoryIcon } from '@/lib/constants/placeIcons';
import { getDayColor } from '@/lib/constants/dayColors';

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

/** 생성기는 대중교통 일정의 짧은 구간도 CAR로 남겨 택시로 보여 준다. */
function legMode(stop: CuratedStop, transport: CuratedTrip['transport']): TransportType {
  const mode = stop.move?.mode ?? 'WALK';
  return mode === 'CAR' && transport !== 'car' ? 'TAXI' : mode;
}

const KIND_ICON_KEY: Record<string, string> = {
  숙소: '숙소',
  카페: '카페',
  베이커리: '카페',
  디저트: '카페',
  식당: '맛집',
  가이세키: '맛집',
  다코야키: '맛집',
  버거: '맛집',
};

function kindIcon(kind: string) {
  if (kind === '공항' || kind === '역') return getCategoryIcon('');
  return getCategoryIcon(KIND_ICON_KEY[kind] ?? '관광');
}

const httpsImage = (url: string | null) => (url ? url.replace(/^http:\/\//, 'https://') : null);

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
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
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
              <h2 className="flex items-center gap-2.5 text-[20px] font-extrabold tracking-[-0.02em] text-foreground">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                  style={{ background: getDayColor(d.day).bg }}
                  aria-hidden="true"
                >
                  {d.day}
                </span>
                <span>
                  {d.day}일차 · {d.title}
                </span>
              </h2>
              <p className="mt-1 pl-[38px] text-xs font-semibold text-muted">
                {d.stops.length}곳 · 이동 {dayKm}km · {d.stops[0]?.start}–{d.stops[d.stops.length - 1]?.end}
              </p>

              <ol className="mt-3">
                {d.stops.map((s, i) => {
                  const Icon = kindIcon(s.kind);
                  const image = httpsImage(s.imageUrl);
                  return (
                    <li key={`${d.day}-${i}`}>
                      {s.move && (
                        <TransitInfo mode={legMode(s, trip.transport)} duration={s.move.minutes} distance={s.move.km} />
                      )}
                      <article className="flex gap-3 rounded-[10px] bg-card-bg px-3.5 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <time className="shrink-0 text-[13px] font-extrabold tabular-nums text-accent-weak-fg">{s.start}</time>
                            <Icon size={14} className="shrink-0 translate-y-[2px] text-muted" aria-hidden="true" />
                            <h3 className="min-w-0 text-[15px] font-bold text-foreground">{s.name}</h3>
                            <span className="ml-auto shrink-0 text-xs font-semibold text-muted-2">{s.kind}</span>
                          </div>
                          <p className="mt-1 max-w-[560px] text-[13px] leading-[1.55] text-text-2">{s.note}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-2">
                            <span className="tabular-nums">{s.start} - {s.end}</span>
                            {s.cost != null && s.cost > 0 && (
                              <span className="tabular-nums">
                                예상 <b className="font-bold text-text-2">{won(s.cost)}</b>
                              </span>
                            )}
                            {s.address && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={10} className="shrink-0" aria-hidden="true" /> {s.address}
                              </span>
                            )}
                          </div>
                        </div>
                        {image && (
                          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-surface-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                          </div>
                        )}
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
                    <span className="text-xs font-bold text-accent-weak-fg">{periodLabel(t.nights)} · {t.themeLabel}</span>
                    <span className="mt-1 block text-[15px] font-extrabold text-foreground">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 rounded-2xl bg-accent-soft p-6 text-center">
          <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-foreground">날짜와 취향만 바꿔서 내 일정으로</h2>
          <p className="mt-1.5 text-[14px] text-text-2">문장 하나면 동선·시간·예산까지 다시 짜드려요.</p>
          <div className="mt-4 flex justify-center">
            <StartTripButton sentence={sentence} label="이 일정으로 내 여행 만들기" />
          </div>
          <p className="mt-4 text-xs text-muted">
            <Link href={`/trips/${region}`} className="underline hover:text-foreground">{info.name} 여행 코스 전체 보기</Link>
            {' · '}검수일 {trip.reviewedAt}
          </p>
          {trip.days.some((d) => d.stops.some((st) => st.imageUrl?.includes('visitkorea.or.kr'))) && (
            <p className="mt-1 text-xs text-muted-2">장소 사진 출처: 한국관광공사</p>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
