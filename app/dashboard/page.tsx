import { SensorCards } from "@/components/dashboard/sensor-cards";
import { SensorChart } from "@/components/dashboard/sensor-chart";
import { SensorIngestButton } from "@/components/dashboard/sensor-ingest-button";
import { ActuatorPanel } from "@/components/dashboard/actuator-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-muted-foreground">
          실시간 센서 모니터링 · 액추에이터 원격 제어
        </p>
      </div>

      <section className="space-y-6">
        <Card className="border-l-[6px] border-section-sensor-accent bg-section-sensor-bg shadow-[0_2px_0_0_hsl(0_0%_100%/.7)_inset,0_4px_12px_hsl(0_0%_0%/.06),0_12px_28px_hsl(var(--section-sensor-accent)/0.15)]">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl">센서 (실시간)</CardTitle>
              <CardDescription>
                온도, 습도, EC, pH — MQTT 또는 DB 최신값
              </CardDescription>
            </div>
            <SensorIngestButton />
          </CardHeader>
          <CardContent className="space-y-4">
            <SensorCards />
          </CardContent>
        </Card>

        <Card className="border-l-[6px] border-section-chart-accent bg-section-chart-bg shadow-[0_2px_0_0_hsl(0_0%_100%/.7)_inset,0_4px_12px_hsl(0_0%_0%/.06),0_12px_28px_hsl(var(--section-chart-accent)/0.15)]">
          <CardHeader>
            <CardTitle className="text-xl">센서 이력</CardTitle>
            <CardDescription>
              최근 48건 · 10초마다 갱신 (라인 차트)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SensorChart />
          </CardContent>
        </Card>

        <Card className="border-l-[6px] border-section-actuator-accent bg-section-actuator-bg shadow-[0_2px_0_0_hsl(0_0%_100%/.7)_inset,0_4px_12px_hsl(0_0%_0%/.06),0_12px_28px_hsl(var(--section-actuator-accent)/0.15)]">
          <CardHeader>
            <CardTitle className="text-xl">액추에이터 제어</CardTitle>
            <CardDescription>
              원격 제어 — 클릭 시 MQTT로 명령 전송
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActuatorPanel />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
