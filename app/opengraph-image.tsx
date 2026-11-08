import { ImageResponse } from 'next/og';

/**
 * 자체 이미지를 두지 않은 모든 페이지가 이 이미지를 쓴다(Next 규약).
 * ImageResponse는 폰트 파일을 직접 실어야 해서 한글을 넣지 않는다. 제목은 og:title이 담는다.
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
          // 앱 다크 테마와 같은 조합
          background: '#14161c',
          padding: '0 96px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* 잉크 배경 위에 잉크 사각형을 두면 대비가 없어 묻히므로 마크만 그린다. */}
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
