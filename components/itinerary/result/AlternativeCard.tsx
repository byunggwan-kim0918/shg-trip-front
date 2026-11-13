'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import type { AlternativeOption } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { displayName, originalName, originalNameLang } from '@/lib/utils/placeName';
import ImageCredit from '@/components/common/ImageCredit';
import PlaceFallbackArt from '@/components/common/PlaceFallbackArt';

interface AlternativeCardProps {
  alternative: AlternativeOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const { place } = alternative;
  const title = displayName(place);
  const original = originalName(place);
  const img = proxyImageUrl(place.imageUrl);
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [img]);
  const showPhoto = Boolean(img) && !imgError;
  return (
    <div className="relative flex flex-1">
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-1 items-center gap-2.5 rounded-[10px] border p-2.5 text-left transition-colors ${
          isSelected ? 'border-accent bg-accent-soft' : 'border-card-border bg-surface-2 hover:bg-surface-hover'
        }`}
      >
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
          {img && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <PlaceFallbackArt category={place.category} size="sm" className="h-full w-full" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-foreground">{title}</span>
          {original && <span lang={originalNameLang(place)} className="block truncate text-xs text-muted-2">{original}</span>}
          <span className="block text-xs text-muted-2">
            {place.rating != null && (
              <span className="inline-flex items-center gap-0.5">
                {/* 별점은 상태가 아니라 데이터라 상태색(완료 초록)을 쓰지 않는다 */}
                <Star size={9} className="fill-current text-muted" aria-hidden="true" />
                <span className="tabular-nums">{place.rating}</span>
              </span>
            )}
            {place.rating != null && alternative.estimatedCost != null && ' · '}
            {alternative.estimatedCost != null && `${alternative.estimatedCost.toLocaleString()}원`}
          </span>
        </span>
      </button>
      {showPhoto && (
        // 카드 전체가 버튼이라 안에 둘 수 없어 썸네일 오른쪽 아래 모서리(테두리 1 + 패딩 10 + 44px)에 겹친다.
        <ImageCredit
          credit={place.imageCredit}
          license={place.imageLicense}
          sourceUrl={place.imageSourceUrl}
          size="sm"
          className="left-[39px] top-1/2 translate-y-[6px]"
        />
      )}
    </div>
  );
}
