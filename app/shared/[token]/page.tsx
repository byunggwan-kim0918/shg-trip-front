import Link from 'next/link';
import { LinkIcon } from 'lucide-react';
import { backendFetch } from '@/lib/server/backendFetch';
import type { Itinerary } from '@/lib/types/itinerary';
import EmptyState from '@/components/common/EmptyState';
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
            <Link href="/" className="text-[13px] font-semibold text-accent hover:underline">
              SHG trip 홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <SharedItineraryView itinerary={itinerary} />;
}
