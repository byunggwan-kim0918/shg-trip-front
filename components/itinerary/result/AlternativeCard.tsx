'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import type { AlternativeOption } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import { displayName, originalName, originalNameLang } from '@/lib/utils/placeName';

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
  return (
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
          // 빈 44px 블록은 surface-2 위에서 보이지 않으므로 장소명 이니셜을 둔다.
          <span className="flex h-full w-full items-center justify-center bg-surface-3 text-xs font-extrabold tracking-[-0.02em] text-muted">
            {title.slice(0, 2)}
          </span>
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
  );
}
