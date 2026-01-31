import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/60 via-background to-muted/50">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="text-lg">🌱</span>
            <span>Smartfarm</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              대시보드
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground"
            >
              홈
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
