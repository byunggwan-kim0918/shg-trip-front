import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader, { PublicFooter } from '@/components/trips/PublicHeader';
import SentenceStart from '@/components/trips/SentenceStart';
import { getAllTrips, periodLabel, SITE_URL } from '@/lib/trips/content';
import { REGIONS } from '@/lib/trips/regions';

export const metadata: Metadata = {
  title: '여행 코스 추천 | 국내·일본 도시별 일정 모음 - SHG trip',
  description: '서울, 부산, 제주, 오사카, 교토, 후쿠오카 등 국내·일본 도시별 추천 여행 코스. 기간과 테마별로 하루 동선, 시간, 예상 비용까지 정리했습니다.',
  alternates: { canonical: `${SITE_URL}/trips` },
};

const COUNTRY_LABEL = { KR: '국내', JP: '일본' } as const;

export default function TripsHubPage() {
  const trips = getAllTrips();
  const regions = REGIONS.map((r) => ({ ...r, trips: trips.filter((t) => t.region === r.slug) })).filter(
    (r) => r.trips.length > 0,
  );

  return (
    <div className="min-h-[100dvh] bg-surface">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-5 pt-10 sm:px-8 sm:pt-14">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-[40px]">
          여행 코스 추천
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-text-2">
          도시별로 검수한 추천 일정입니다. 마음에 드는 코스를 골라 날짜와 취향만 바꾸면 내 일정이 됩니다.
        </p>
        <div className="mt-6 max-w-[560px]">
          <SentenceStart placeholder="제주 2박3일 맛집 위주로" />
        </div>

        {(['KR', 'JP'] as const).map((country) => {
          const list = regions.filter((r) => r.country === country);
          if (list.length === 0) return null;
          return (
            <section key={country} className="mt-12">
              <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">{COUNTRY_LABEL[country]}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/trips/${r.slug}`}
                      className="block h-full rounded-2xl border border-card-border bg-card-bg p-5 transition-colors hover:bg-surface-hover"
                    >
                      <span className="text-[18px] font-extrabold tracking-[-0.02em] text-foreground">{r.name}</span>
                      <span className="mt-1 block text-[12px] font-semibold text-muted">
                        코스 {r.trips.length}개 · {[...new Set(r.trips.map((t) => periodLabel(t.nights)))].join('·')}
                      </span>
                      <span className="mt-3 block line-clamp-2 text-[13px] leading-relaxed text-text-2">{r.intro}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <PublicFooter />
    </div>
  );
}
