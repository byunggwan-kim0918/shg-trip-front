export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background aurora-bg noise-overlay px-4">
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
