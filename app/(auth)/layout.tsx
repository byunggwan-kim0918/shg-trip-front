export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[linear-gradient(160deg,#f3f6fb_0%,#eef2f8_100%)] dark:bg-[linear-gradient(160deg,#181b22_0%,#121419_100%)]">
      <div className="w-full flex justify-center">{children}</div>
    </div>
  );
}
