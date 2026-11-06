'use client';

import { useEffect, useState } from 'react';
import { coverGradient } from '@/lib/utils/coverGradient';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

interface Props {
  destination: string;
  /** 없으면 hue 그라데이션으로 그린다. */
  imageUrl?: string | null;
  /** 같은 목적지 카드끼리 구분하는 hue 오프셋. */
  seedOffset?: number;
  showLabel?: boolean;
  /** px (그리드 40 / 히어로 80). */
  labelSize?: number;
  scrim?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function DestinationCover({
  destination,
  imageUrl,
  seedOffset = 0,
  showLabel = true,
  labelSize = 40,
  scrim = false,
  className = '',
  children,
}: Props) {
  const img = proxyImageUrl(imageUrl);
  const [imgError, setImgError] = useState(false);
  // `.dark` 클래스 토큰 방식이라 Tailwind `dark:` 변형으로는 두 그라데이션을 전환할 수 없다.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
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
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: coverGradient(destination, isDark ? 'dark' : 'light', seedOffset) }}
        />
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
          className={
            onPhoto
              ? 'absolute right-3 bottom-1.5 font-extrabold leading-none'
              : 'absolute left-3.5 top-3 font-semibold leading-none text-muted'
          }
          style={{
            // 사진이 없을 때 큰 워터마크는 카드 제목을 반복하고 긴 목적지명이 잘리므로
            // 좌상단 작은 식별 라벨로만 둔다.
            fontSize: onPhoto ? labelSize : Math.max(11, Math.round(labelSize * 0.3)),
            color: onPhoto ? 'rgba(255,255,255,0.88)' : undefined,
            letterSpacing: onPhoto ? '-0.03em' : '-0.01em',
          }}
        >
          {destination}
        </span>
      )}

      {children}
    </div>
  );
}
