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

/** 공유 토큰으로 일정 조회 (비인증 SSR). 만료·무효면 null. */
async function fetchShared(token: string): Promise<Itinerary | null> {
  try {
    const res = await backendFetch(`/api/shared/${encodeURIComponent(token)}`, {
      // 공유 일정은 캐시하지 않음(만료·수정 반영)
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body: ApiEnvelope<Itinerary> = await res.json();
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

/**
 * 공유 링크 미리보기.
 *
 * 이게 없어서 카카오톡·슬랙·iMessage에 붙인 모든 공유 링크가 사이트 기본 제목
 * ("SHG trip · AI 여행 플래너")으로 똑같이 떴다. 공유는 이 제품이 앱 밖으로 나가는
 * 유일한 표면인데, 링크 카드만 보면 어느 여행인지 분간이 안 됐다.
 *
 * SSR에서 이미 일정을 받아오므로(fetchShared) 같은 호출을 재사용한다.
 * Next가 generateMetadata와 페이지의 동일 요청을 dedupe하므로 왕복이 늘지 않는다.
 */
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
