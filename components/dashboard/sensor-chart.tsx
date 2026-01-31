"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Tables } from "@/lib/supabase/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SensorReading = Tables<"sensor_readings">;

const CHART_LIMIT = 48;
const POLL_INTERVAL_MS = 10000;

const SENSOR_CHARTS: {
  dataKey: keyof SensorReading;
  label: string;
  unit: string;
  stroke: string;
}[] = [
  { dataKey: "temperature", label: "온도", unit: "°C", stroke: "hsl(var(--chart-1))" },
  { dataKey: "humidity", label: "습도", unit: "%", stroke: "hsl(var(--chart-2))" },
  { dataKey: "ec", label: "EC", unit: "mS/cm", stroke: "hsl(var(--chart-3))" },
  { dataKey: "ph", label: "pH", unit: "", stroke: "hsl(var(--chart-4))" },
];

function formatAxisTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function SingleSensorChart({
  data,
  label,
  unit,
  stroke,
}: {
  data: { time: string; timeLabel: string; value: number }[];
  label: string;
  unit: string;
  stroke: string;
}) {
  return (
    <Card className="overflow-hidden border-section-chart-accent/25 bg-card/95 shadow-sm backdrop-blur-sm">
      <CardContent className="p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {label}
          {unit ? ` (${unit})` : ""}
        </p>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                width={36}
                tickFormatter={(v) => (Number.isFinite(v) ? String(v) : "—")}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number | undefined) => [
                  value != null && Number.isFinite(value) ? `${value} ${unit}`.trim() : "—",
                  label,
                ]}
                labelFormatter={(_, payload) =>
                  payload[0]?.payload?.time
                    ? new Date(payload[0].payload.time).toLocaleString("ko-KR")
                    : ""
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                name={label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SensorChart() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChart = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/sensor?limit=${CHART_LIMIT}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(await res.text());
      const data: SensorReading[] = await res.json();
      setReadings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "차트 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChart();
    const id = setInterval(fetchChart, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchChart]);

  if (loading && readings.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12 text-muted-foreground">
        차트 데이터 로딩 중…
      </div>
    );
  }

  if (error && readings.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12 text-muted-foreground">
        표시할 센서 이력이 없습니다.
      </div>
    );
  }

  const chronological = [...readings].reverse();

  return (
    <div className="space-y-4">
      <Badge variant="outline" className="font-normal">
        최근 {readings.length}건 · 10초마다 갱신 (아두이노 10초 주기와 동일)
      </Badge>
      <div className="grid gap-4 sm:grid-cols-2">
        {SENSOR_CHARTS.map(({ dataKey, label, unit, stroke }) => {
          const data = chronological.map((r) => {
            const raw = r[dataKey];
            const value = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
            return {
              time: r.created_at,
              timeLabel: formatAxisTime(r.created_at),
              value,
            };
          });
          return (
            <SingleSensorChart
              key={dataKey}
              data={data}
              label={label}
              unit={unit}
              stroke={stroke}
            />
          );
        })}
      </div>
    </div>
  );
}
