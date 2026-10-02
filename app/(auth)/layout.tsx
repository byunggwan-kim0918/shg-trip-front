import ThemeToggle from '@/components/common/ThemeToggle';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 배경은 토큰(--background)을 쓴다. 이전엔 Tailwind `dark:` 변형에 옛 팔레트 hex를 박아뒀는데,
    // globals.css에 @custom-variant dark가 없어 `dark:`는 OS 설정을 따르고 토큰은 .dark 클래스를 따랐다.
    // 사용자가 수동 테마를 켜면 배경(라이트)과 텍스트/버튼(다크)이 어긋나 워드마크가 사라지는 버그가 있었다.
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4">
      {/* 비로그인 화면에는 헤더가 없어 테마 전환 수단이 아예 없었다. 우상단 고정. */}
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      <div className="w-full flex justify-center">{children}</div>
    </div>
  );
}
