import ThemeToggle from '@/components/common/ThemeToggle';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Tailwind `dark:`는 OS 설정을, 토큰은 .dark 클래스를 따르므로 배경도 토큰으로 칠해야
    // 수동 테마에서 배경과 텍스트가 어긋나지 않는다.
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-4">
      {/* 비로그인 화면에는 헤더가 없어 테마 전환을 여기서 제공한다. */}
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      <div className="w-full flex justify-center">{children}</div>
    </div>
  );
}
