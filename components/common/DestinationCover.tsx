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
  /** 큰 타일(콜라주)용 고채도 그라데이션. 여럿이 나란히 놓일 때 저채도는 물빠져 보인다. */
  rich?: boolean;
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
  rich = false,
  className = '',
  children,
}: Props) {
  const img = proxyImageUrl(imageUrl);
  const [imgError, setImgError] = useState(false);
  // 이 프로젝트는 `.dark` 클래스 토큰 방식이라 Tailwind `dark:` 변형이 동작하지 않는다.
  // 이전엔 두 그라데이션을 dark:opacity로 전환해서 다크에서도 라이트(밝은 파스텔)가 보였다.
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  // 라벨은 원래 hue 그라데이션 커버용(흰색 18%)이라 실사진 위에선 묻힌다.
  // 사진이 실제로 보일 때만 하단 스크림을 깔고 라벨 알파를 올린다.
  const onPhoto = Boolean(img) && !imgError;
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
        <div
          className="absolute inset-0"
          style={{ background: coverGradient(destination, isDark ? 'dark' : 'light', seedOffset, rich) }}
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
          className="absolute right-3 bottom-1.5 font-extrabold leading-none"
          style={{
            fontSize: labelSize,
            // 사진 위: 스크림이 있어 흰색.
            // 그라데이션 위(폴백): 타일에 사진이 없으면 목적지 이름이 유일한 내용물이다.
            // 알파 0.28~0.30은 워터마크로 읽혀서 타일이 "빈 색 블록"이 됐다. 내용물 수준으로 올린다.
            color: onPhoto ? 'rgba(255,255,255,0.88)' : isDark ? 'rgba(255,255,255,0.62)' : 'rgba(20,22,28,0.52)',
            letterSpacing: '-0.03em',
          }}
        >
          {destination}
        </span>
      )}

      {children}
    </div>
  );
}
