import { ImageResponse } from 'next/og';

/**
 * 없으면 iOS가 페이지 스크린샷을 홈 화면 아이콘으로 쓴다.
 * 애플은 투명 배경을 검게 합성하고 모서리를 직접 깎으므로 라운딩 없는 꽉 찬 사각형으로 둔다.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1c1c1e',
        }}
      >
        <svg width={104} height={104} viewBox="0 0 32 32" fill="none">
          <path
            d="M8 23C13 23 12 11 23 10"
            stroke="#ffffff"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          <circle cx="23" cy="10" r="3.6" fill="#c8d158" />
        </svg>
      </div>
    ),
    size,
  );
}
