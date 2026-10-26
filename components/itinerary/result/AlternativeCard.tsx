'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import type { AlternativeOption } from '@/lib/types/itinerary';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

interface AlternativeCardProps {
  alternative: AlternativeOption;
  isSelected: boolean;
  onSelect: () => void;
}

/** "이 시간대 대안" 미니카드 (4a). 썸네일44 + 이름 + ★평점·비용. */
export default function AlternativeCard({ alternative, isSelected, onSelect }: AlternativeCardProps) {
  const { place } = alternative;
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
          <img src={img} alt={place.name} className="h-full w-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          // 사진 없으면 장소명 이니셜. 커버 폴백이 종이 톤이 된 뒤로 이 44px 블록은
          // surface-2 위에서 사실상 보이지 않는 빈 구멍이었다(형제 화면과 같은 처리로 통일).
          <span className="flex h-full w-full items-center justify-center bg-surface-3 text-[11px] font-extrabold tracking-[-0.02em] text-muted">
            {place.name.slice(0, 2)}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-foreground">{place.name}</span>
        <span className="block text-[11px] text-muted-2">
          {place.rating != null && (
            <span className="inline-flex items-center gap-0.5">
              {/* 별점은 상태가 아니라 데이터 — 상태색(완료 초록)을 빌려 쓰지 않는다 */}
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
