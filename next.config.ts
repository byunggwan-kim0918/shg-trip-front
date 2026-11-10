import type { NextConfig } from "next";

// 스크립트 CSP는 넣지 않는다 — Next 인라인 부트스트랩·maplibre 워커·OAuth 리다이렉트를 nonce 없이 막게 된다.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const APP_URL = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://myshgtrip.com");

// 옛 로그인 영역 주소. 북마크·설치한 앱·열어 둔 탭이 계속 쓴다. loading은 :id보다 먼저 와야 한다.
const LEGACY_APP_ROUTES = [
  { source: "/main", destination: "/app/trips" },
  { source: "/main/my-trips", destination: "/app/trips" },
  { source: "/main/plan/new", destination: "/app/trips/new" },
  { source: "/main/itinerary/loading", destination: "/app/trips/generating" },
  { source: "/main/itinerary/:id", destination: "/app/trips/:id" },
  { source: "/main/:path*", destination: "/app/trips" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  // 앱 서버는 자기 빌드 청크만 갖고 있어 롤링 배포 중 이전 빌드 청크 요청이 404가 난다.
  assetPrefix: process.env.ASSET_PREFIX || undefined,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // 쿠키는 호스트별이고 OAuth redirect_uri는 루트 도메인 고정이라, www에서 시작한 로그인·탈퇴는 state를 잃는다.
  async redirects() {
    return [{
      source: "/:path*",
      // Next는 포트를 뗀 Host를 정규식으로 비교한다.
      has: [{ type: "host", value: `www\\.${APP_URL.hostname.replaceAll(".", "\\.")}` }],
      destination: `${APP_URL.origin}/:path*`,
      permanent: true,
    }, ...LEGACY_APP_ROUTES.map((r) => ({ ...r, permanent: true })),
    // 로그인 영역의 첫 화면은 여행 목록이다. 나중에 /app에 다른 화면을 둘 수 있게 영구 이동으로 두지 않는다.
    { source: "/app", destination: "/app/trips", permanent: false }];
  },
};

export default nextConfig;
