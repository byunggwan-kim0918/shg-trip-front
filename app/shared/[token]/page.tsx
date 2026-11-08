import type { Metadata } from 'next';
import Link from 'next/link';
import { LinkIcon } from 'lucide-react';
import { backendFetch } from '@/lib/server/backendFetch';
import type { Itinerary } from '@/lib/types/itinerary';
import EmptyState from '@/components/common/EmptyState';
import { normalizeText } from '@/lib/utils/text';
import { nightsLabel } from '@/lib/utils/tripStatus';
import SharedItineraryView from '@/components/itinerary/SharedItineraryView';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: null | { code: string; message: string };
}

/** 비인증 SSR 조회. 만료·무효 토큰이면 null. */
async function fetchShared(token: string): Promise<Itinerary | null> {
  try {
    const res = await backendFetch(`/api/shared/${encodeURIComponent(token)}`, {
      // 만료·수정이 바로 반영돼야 해서 캐시하지 않는다.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body: ApiEnvelope<Itinerary> = await res.json();
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

/** 페이지와 같은 fetchShared 요청은 Next가 dedupe하므로 메타데이터 때문에 왕복이 늘지 않는다. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const itinerary = await fetchShared(token);

  if (!itinerary) {
    return {
      title: '만료된 공유 링크 · SHG trip',
      description: '공유 링크가 유효하지 않거나 만료되었습니다.',
      robots: { index: false, follow: false },
    };
  }

  // 제목은 LLM 생성물이라 em-dash가 섞인다. 화면과 같은 정규화를 링크 카드에도 적용한다.
  const title = normalizeText(itinerary.title) || `${itinerary.destination} 여행`;
  const period = `${itinerary.startDate} - ${itinerary.endDate}`;
  const description = `${itinerary.destination} · ${period} · ${nightsLabel(itinerary.startDate, itinerary.endDate)}`;

  return {
    title: `${title} · SHG trip`,
    description,
    // 공유 링크는 검색 대상이 아니다(토큰이 노출된다). 미리보기만 살린다.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'SHG trip',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const itinerary = await fetchShared(token);

  if (!itinerary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <EmptyState
            icon={LinkIcon}
            title="링크가 만료됐거나 잘못됐어요"
            description="공유 링크가 유효하지 않거나 만료되었습니다."
          />
          <div className="mt-4 text-center">
            <Link href="/" className="text-[13px] font-semibold text-accent-weak-fg hover:underline">
              SHG trip 홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <SharedItineraryView itinerary={itinerary} />;
}
