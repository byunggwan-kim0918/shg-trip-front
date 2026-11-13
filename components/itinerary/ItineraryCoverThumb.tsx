'use client';

import { useState } from 'react';
import type { Itinerary } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { placeCategoryLabel } from '@/lib/utils/placeCategory';
import ImageCredit from '@/components/common/ImageCredit';
import PlaceFallbackArt from '@/components/common/PlaceFallbackArt';

interface CoverPhoto {
  url: string;
  credit?: string | null;
  license?: string | null;
  sourceUrl?: string | null;
}

/**
 * 과거 데이터의 상대경로(/api/places/{id}/photo)는 깨지므로 절대 URL만 쓰고,
 * 없으면 비동기 업로드로 함께 채워지는 첫 스텝 사진을 쓴다. 출처는 고른 사진의 것을 따른다.
 */
function resolveCoverPhoto(itinerary: Itinerary): CoverPhoto | null {
  const { coverImage } = itinerary;
  if (coverImage && /^https?:\/\//.test(coverImage)) {
    return {
      url: coverImage,
      credit: itinerary.coverImageCredit,
      license: itinerary.coverImageLicense,
      sourceUrl: itinerary.coverImageSourceUrl,
    };
  }
  const place = itinerary.steps.find((s) => s.place?.imageUrl)?.place;
  const url = proxyImageUrl(place?.imageUrl);
  if (!place || !url) return null;
  return { url, credit: place.imageCredit, license: place.imageLicense, sourceUrl: place.imageSourceUrl };
}

interface Props {
  itinerary: Itinerary;
  alt: string;
  /** 표시 여부 등 반응형 클래스 */
  className?: string;
}

export default function ItineraryCoverThumb({ itinerary, alt, className = '' }: Props) {
  const photo = resolveCoverPhoto(itinerary);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  // 첫 스텝은 대개 공항·숙소라 관광지 분류로 그린다.
  const artCategory = itinerary.steps.find((s) => placeCategoryLabel(s.place?.category) === '관광')?.place?.category ?? null;

  return (
    <div className={`relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl ${className}`}>
      {photo && photo.url !== failedUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={alt} className="h-full w-full object-cover" onError={() => setFailedUrl(photo.url)} />
          <ImageCredit
            credit={photo.credit}
            license={photo.license}
            sourceUrl={photo.sourceUrl}
            className="bottom-1.5 right-1.5"
          />
        </>
      ) : (
        <PlaceFallbackArt category={artCategory} className="h-full w-full" />
      )}
    </div>
  );
}
