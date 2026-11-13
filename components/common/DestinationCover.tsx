'use client';

import { useEffect, useState } from 'react';
import { proxyImageUrl } from '@/lib/utils/imageUrl';
import ImageCredit from './ImageCredit';
import PlaceFallbackArt from './PlaceFallbackArt';

interface Props {
  destination: string;
  /** 없으면 분류 그림으로 그린다. */
  imageUrl?: string | null;
  /** 사진이 보일 때 왼쪽 아래 ⓘ로 보인다. 카드 전체가 버튼이면 넘기지 말고 버튼 밖에 따로 둔다. */
  imageCredit?: string | null;
  imageLicense?: string | null;
  imageSourceUrl?: string | null;
  showLabel?: boolean;
  /** px (그리드 40 / 히어로 80). */
  labelSize?: number;
  scrim?: boolean;
  className?: string;
  /** 사진을 불러오지 못하면 한 번 부른다. */
  onImageError?: () => void;
  children?: React.ReactNode;
}

export default function DestinationCover({
  destination,
  imageUrl,
  imageCredit,
  imageLicense,
  imageSourceUrl,
  showLabel = true,
  labelSize = 40,
  scrim = false,
  className = '',
  onImageError,
  children,
}: Props) {
  const img = proxyImageUrl(imageUrl);
  const [imgError, setImgError] = useState(false);
  // 라벨(흰색 18%)은 실사진 위에서 묻히므로 사진이 보일 때만 하단 스크림을 깔고 알파를 올린다.
  const onPhoto = Boolean(img) && !imgError;
  // imageUrl이 비동기로 채워지면 이전 에러 상태 때문에 새 URL을 건너뛰지 않게 한다.
  useEffect(() => { setImgError(false); }, [img]);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {img && !imgError ? (
        <img
          src={img}
          alt={destination}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            setImgError(true);
            onImageError?.();
          }}
        />
      ) : (
        <PlaceFallbackArt size="banner" className="absolute inset-0" />
      )}

      {scrim && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,8,12,0.6) 0%, rgba(6,8,12,0.2) 55%, rgba(6,8,12,0) 100%)',
          }}
        />
      )}

      {showLabel && onPhoto && (
        <div
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: 'linear-gradient(to top, rgba(6,8,12,0.55) 0%, rgba(6,8,12,0) 100%)' }}
        />
      )}

      {showLabel && (
        <span
          aria-hidden="true"
          className={`absolute right-3 bottom-1.5 max-w-[calc(100%-1.5rem)] overflow-hidden whitespace-nowrap font-extrabold leading-none ${
            onPhoto ? '' : 'text-foreground/15'
          }`}
          style={{
            fontSize: labelSize,
            color: onPhoto ? 'rgba(255,255,255,0.88)' : undefined,
            // 밝은 사진에서는 하단 스크림만으로 흰 글자가 묻힌다.
            textShadow: onPhoto ? '0 1px 3px rgba(6,8,12,0.55)' : undefined,
            letterSpacing: '-0.03em',
          }}
        >
          {destination}
        </span>
      )}

      {onPhoto && (
        <ImageCredit credit={imageCredit} license={imageLicense} sourceUrl={imageSourceUrl} className="bottom-2 left-2" />
      )}

      {children}
    </div>
  );
}
