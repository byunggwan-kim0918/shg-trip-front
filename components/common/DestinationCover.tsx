'use client';

import { useEffect, useState } from 'react';
import { coverGradient } from '@/lib/utils/coverGradient';
import { proxyImageUrl } from '@/lib/utils/imageUrl';

interface Props {
  destination: string;
  /** 실사진 있으면 우선 사용, 없으면 hue 그라데이션. */
  imageUrl?: string | null;
  /** 같은 목적지 카드 미세 구분용 hue 오프셋. */
  seedOffset?: number;
  /** 큰 목적지 글자 표시 여부 (기본 true). */
  showLabel?: boolean;
  /** 글자 크기 px (그리드 40 / 히어로 80). */
  labelSize?: number;
  /** 어둠 스크림(히어로 좌측 그라데) 오버레이. */
  scrim?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 목적지 커버. 라이트/다크 그라데이션을 두 레이어로 깔고 .dark 클래스로 스위칭.
 * 커버 위 우하단 반투명 목적지 글자 + (옵션) 어둠 스크림.
 */
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
  // imageUrl(비동기 채움 등)이 바뀌면 에러 상태 초기화 → 새 URL 재시도
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
        <>
          {/* light */}
          <div
            className="absolute inset-0 dark:opacity-0"
            style={{ background: coverGradient(destination, 'light', seedOffset) }}
          />
          {/* dark */}
          <div
            className="absolute inset-0 opacity-0 dark:opacity-100"
            style={{ background: coverGradient(destination, 'dark', seedOffset) }}
          />
        </>
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

      {showLabel && (
        <span
          className="absolute right-3 bottom-1.5 font-extrabold leading-none"
          style={{ fontSize: labelSize, color: 'rgba(255,255,255,0.18)', letterSpacing: '-0.03em' }}
        >
          {destination}
        </span>
      )}

      {children}
    </div>
  );
}
