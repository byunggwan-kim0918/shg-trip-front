import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeInitializer from "@/components/layout/ThemeInitializer";

// Pretendard is loaded via CDN <link> below (not available in next/font/google).
// The CSS variable --font-pretendard is referenced from globals.css @theme.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHG trip · AI 여행 플래너",
  description: "말 한마디면, 여행이 완성됩니다. AI가 동선·시간·예산까지 한 번에.",
  openGraph: {
    title: "SHG trip · AI 여행 플래너",
    description: "말 한마디면, 여행이 완성됩니다. AI가 동선·시간·예산까지 한 번에.",
    siteName: "SHG trip",
    type: "website",
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
};

/**
 * 모바일 브라우저 상단 바 색. 이게 없으면 다크 테마에서도 주소창만 흰색으로 남아
 * 화면 위쪽에 밝은 띠가 생긴다 — 폰에서 가장 먼저 보이는 이음매다.
 * 값은 globals.css의 --background과 같다(라이트 #eef0f4 / 다크 #0d0e12).
 * 테마 전환은 .dark 클래스라 media 조건과 어긋날 수 있지만, meta는 클래스를 읽을 수 없어
 * OS 설정이 가장 가까운 근사다.
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
