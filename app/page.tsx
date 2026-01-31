import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background to-muted/50" />
      <div className="absolute right-0 top-0 h-[480px] w-[480px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[360px] w-[360px] translate-y-1/2 -translate-x-1/3 rounded-full bg-primary/5 blur-3xl" />

      <div className="container flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <span className="text-5xl" aria-hidden>🌱</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Smartfarm Web
          </h1>
          <p className="text-lg text-muted-foreground">
            스마트팜 웹 서비스 — 실시간 센서 모니터링과 액추에이터 원격 제어
          </p>
          <Button asChild size="lg" className="mt-2 gap-2">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        </div>

        <Card className="w-full max-w-md border-dashed border-primary/25 bg-card/80">
          <CardContent className="flex flex-wrap items-center justify-center gap-4 py-6 text-sm text-muted-foreground">
            <span>온도 · 습도 · EC · pH</span>
            <span aria-hidden>·</span>
            <span>LED · 펌프 · 팬 제어</span>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
