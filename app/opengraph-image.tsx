import { ImageResponse } from 'next/og';

/**
 * 링크 미리보기 이미지. 이게 없어서 공유 링크가 어디에 붙든 이미지 없는 텍스트 카드로 떴다.
 * 공유(`/shared/[token]`)는 이 제품이 앱 밖으로 나가는 유일한 표면이라 여기가 첫인상이다.
 *
 * 자체 라우트를 두지 않은 모든 페이지가 이 이미지를 쓴다(Next 규약).
 *
 * 한글을 넣지 않는다 — ImageResponse는 시스템 폰트를 못 쓰고 폰트 파일을 직접 실어야 하는데,
 * 렌더 시점에 CDN에서 Pretendard를 받아오면 미리보기 생성이 외부 네트워크에 묶인다.
 * 라틴 문자만 쓰면 기본 폰트로 해결되고, 여행 제목은 og:title(텍스트)이 이미 담고 있다.
 */
export const alt = 'SHG trip';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          // 다크 잉크 바탕 + 샤르트뢰즈 — 앱 다크 테마와 같은 조합
          background: '#14161c',
          padding: '0 96px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* 1200×630 캔버스에서는 마크를 감쌀 사각형이 필요 없다.
              잉크 사각형을 잉크 배경(#14161c) 위에 두면 대비가 거의 없어 묻힌다. */}
          <svg width={118} height={118} viewBox="0 0 32 32" fill="none">
            <path
              d="M8 23C13 23 12 11 23 10"
              stroke="#ffffff"
              strokeWidth={3.2}
              strokeLinecap="round"
            />
            <circle cx="23" cy="10" r="3.6" fill="#c8d158" />
          </svg>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, color: '#ffffff' }}>
            SHG trip
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 40,
            lineHeight: 1.4,
            color: '#a0a7b1',
          }}
        >
          AI trip planner. Routes, timing and budget in one go.
        </div>
      </div>
    ),
    size,
  );
}
