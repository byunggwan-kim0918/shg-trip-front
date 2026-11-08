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

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
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
    }];
  },
};

export default nextConfig;
