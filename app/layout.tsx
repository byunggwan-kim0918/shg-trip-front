import type { Metadata } from "next";
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
