"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { useSensorMqtt } from "@/hooks/use-sensor-mqtt";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Thermometer,
  Droplets,
  Gauge,
  TestTube,
  type LucideIcon,
} from "lucide-react";

type SensorReading = Tables<"sensor_readings">;

const POLL_INTERVAL_MS = 10000;

function formatTime(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatSensorValue(value: number | null, decimals: number): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return Number(value).toFixed(decimals);
}

type SensorVariant = "temperature" | "humidity" | "ec" | "ph";

const SENSOR_CONFIG: {
  key: keyof Pick<SensorReading, "temperature" | "humidity" | "ec" | "ph">;
  variant: SensorVariant;
  label: string;
  unit: string;
  decimals: number;
  Icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
}[] = [
  {
    key: "temperature",
    variant: "temperature",
    label: "온도",
    unit: "°C",
    decimals: 1,
    Icon: Thermometer,
    iconBgClass: "bg-tile-temperature/30",
    iconColorClass: "text-tile-temperature",
  },
  {
    key: "humidity",
    variant: "humidity",
    label: "습도",
    unit: "%",
    decimals: 1,
    Icon: Droplets,
    iconBgClass: "bg-tile-humidity/30",
    iconColorClass: "text-tile-humidity",
  },
  {
    key: "ec",
    variant: "ec",
    label: "EC",
    unit: "mS/cm",
    decimals: 2,
    Icon: Gauge,
    iconBgClass: "bg-tile-ec/30",
    iconColorClass: "text-tile-ec",
  },
  {
    key: "ph",
    variant: "ph",
    label: "pH",
    unit: "",
    decimals: 2,
    Icon: TestTube,
    iconBgClass: "bg-tile-ph/30",
    iconColorClass: "text-tile-ph",
  },
];

function SensorCard({
  label,
  value,
  unit,
  decimals = 1,
  variant,
  Icon,
  iconBgClass,
  iconColorClass,
  className,
}: {
  label: string;
  value: number | null;
  unit: string;
  decimals?: number;
  variant: SensorVariant;
  Icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  className?: string;
}) {
  const display =
    value != null
      ? `${formatSensorValue(value, decimals)} ${unit}`.trim()
      : "—";
  return (
    <div
      className={cn(
        "sensor-card",
        `sensor-card-${variant}`,
        "overflow-hidden bg-card/95 text-card-foreground backdrop-blur-sm",
        className
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
                  "sensor-card-icon flex size-11 shrink-0 items-center justify-center rounded-xl",
                  iconBgClass
                )}
          >
            <Icon className={cn("size-5", iconColorClass)} aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
              {display}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SensorCards() {
  const mqtt = useSensorMqtt({ persistToDb: true });
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSensor = async () => {
    try {
      const res = await fetch(
        `/api/sensor?limit=1&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(await res.text());
      const data: SensorReading[] = await res.json();
      setReadings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "센서 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSensor();
    const id = setInterval(fetchSensor, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const latestFromMqtt = mqtt.isConnected && mqtt.latest;
  const latestFromDb = readings[0];
  const latest = latestFromMqtt
    ? {
        temperature: mqtt.latest!.temperature,
        humidity: mqtt.latest!.humidity,
        ec: mqtt.latest!.ec,
        ph: mqtt.latest!.ph,
        created_at: mqtt.receivedAt?.toISOString() ?? "",
      }
    : latestFromDb;

  if (loading && !latestFromMqtt && readings.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12 text-muted-foreground">
        센서 데이터 로딩 중…
      </div>
    );
  }

  if (error && !latestFromMqtt && readings.length === 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-12 text-muted-foreground">
        수집된 센서 데이터가 없습니다. 아두이노가 publish 중이거나, NEXT_PUBLIC_MQTT_* 설정 후 새로고침하세요.
      </div>
    );
  }

  const timeLabel = latestFromMqtt
    ? mqtt.receivedAt
      ? formatTime(mqtt.receivedAt)
      : "—"
    : formatTime(latest.created_at);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {latestFromMqtt ? (
          <Badge variant="secondary" className="font-normal">
            실시간 (MQTT) · 수신 시각: {timeLabel}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-normal">
            DB 저장 시각: {timeLabel} (10초마다 갱신)
          </Badge>
        )}
        {mqtt.error && (
          <span className="text-xs text-destructive">MQTT: {mqtt.error}</span>
        )}
      </div>
      {!latestFromMqtt && (
        <p className="text-xs text-muted-foreground">
          A방식 사용 시{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">.env.local</code>
          에{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">NEXT_PUBLIC_MQTT_BROKER_URL</code>
          (wss://…),{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">NEXT_PUBLIC_MQTT_USERNAME</code>
          ,{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">NEXT_PUBLIC_MQTT_PASSWORD</code>
          설정 후 새로고침.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SENSOR_CONFIG.map(({ key, variant, label, unit, decimals, Icon, iconBgClass, iconColorClass }) => (
          <SensorCard
            key={key}
            label={label}
            value={latest[key]}
            unit={unit}
            decimals={decimals}
            variant={variant}
            Icon={Icon}
            iconBgClass={iconBgClass}
            iconColorClass={iconColorClass}
          />
        ))}
      </div>
    </div>
  );
}
