import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInitializer from "@/components/layout/ThemeInitializer";

// Pretendard는 next/font/google에 없어 아래 CDN <link>로 불러온다(globals.css @theme이 --font-pretendard를 쓴다).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 없으면 og:image가 빌드 환경 기준 http://localhost:3000으로 나간다.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://myshgtrip.com"),
  title: "SHG trip · 여행 플래너",
  description: "말 한마디면, 여행이 완성됩니다. 동선·시간·예산까지 한 번에.",
  openGraph: {
    title: "SHG trip · 여행 플래너",
    description: "말 한마디면, 여행이 완성됩니다. 동선·시간·예산까지 한 번에.",
    siteName: "SHG trip",
    type: "website",
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
  verification: { other: { "naver-site-verification": "aad69b2112354204435c59619a34aa93b0c0ed31" } },
};

/**
 * 없으면 다크 테마에서도 모바일 주소창이 흰색으로 남는다. 값은 globals.css --background와 같아야 한다.
 * meta는 .dark 클래스를 읽을 수 없어 OS 설정(media)으로 근사한다.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className={`${geistMono.variable} antialiased`}>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
