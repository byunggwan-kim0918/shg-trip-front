import AuthGuard from '@/components/auth/AuthGuard';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        {/* TODO: Header, Navigation 추가 */}
        <main>{children}</main>
        {/* TODO: Footer 추가 */}
      </div>
    </AuthGuard>
  );
}
