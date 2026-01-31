"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SensorReadingsPayload } from "@/types/mqtt";

const TOPIC = "smartfarm/sensor/readings";

export type SensorMqttState = {
  latest: SensorReadingsPayload | null;
  isConnected: boolean;
  error: string | null;
  receivedAt: Date | null;
};

/**
 * A방식: 브라우저에서 MQTT 구독 (Vercel만 사용 시 실시간 표시).
 * NEXT_PUBLIC_MQTT_BROKER_URL, NEXT_PUBLIC_MQTT_USERNAME, NEXT_PUBLIC_MQTT_PASSWORD 설정 시 동작.
 */
export function useSensorMqtt(options?: { persistToDb?: boolean }): SensorMqttState {
  const [latest, setLatest] = useState<SensorReadingsPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<Date | null>(null);
  const persistToDb = options?.persistToDb ?? true;
  const clientRef = useRef<import("mqtt").MqttClient | null>(null);

  const ingest = useCallback(
    async (payload: SensorReadingsPayload) => {
      if (!persistToDb) return;
      try {
        await fetch("/api/sensor/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    },
    [persistToDb]
  );

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD;

    if (!url || typeof url !== "string" || !url.trim().startsWith("wss")) {
      return;
    }

    let cancelled = false;
    import("mqtt").then((mqttModule) => {
      if (cancelled) return;
      const mqtt = mqttModule.default;
      const client = mqtt.connect(url.trim(), {
        username: username || undefined,
        password: password || undefined,
        clientId: `smartfarm-web-${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 15000,
      });
      clientRef.current = client;

      client.on("connect", () => {
        if (cancelled) return;
        setIsConnected(true);
        setError(null);
        client.subscribe(TOPIC, (err) => {
          if (err) setError(err.message);
        });
      });

      client.on("message", (_topic, buffer) => {
        if (cancelled) return;
        try {
          const raw = JSON.parse(buffer.toString()) as Record<string, unknown>;
          const temperature =
            typeof raw.temperature === "number"
              ? raw.temperature
              : typeof raw.temp === "number"
                ? raw.temp
                : NaN;
          const humidity =
            typeof raw.humidity === "number"
              ? raw.humidity
              : typeof raw.hum === "number"
                ? raw.hum
                : NaN;
          const ec = typeof raw.ec === "number" ? raw.ec : NaN;
          const ph = typeof raw.ph === "number" ? raw.ph : NaN;
          if (
            Number.isFinite(temperature) &&
            Number.isFinite(humidity) &&
            Number.isFinite(ec) &&
            Number.isFinite(ph)
          ) {
            const payload: SensorReadingsPayload = {
              temperature,
              humidity,
              ec,
              ph,
            };
            setLatest(payload);
            setReceivedAt(new Date());
            void ingest(payload);
          }
        } catch {
          // ignore parse error
        }
      });

      client.on("error", (err) => {
        if (!cancelled) setError(err.message);
      });

      client.on("close", () => {
        if (!cancelled) setIsConnected(false);
      });

      client.on("offline", () => {
        if (!cancelled) setIsConnected(false);
      });
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "MQTT load failed");
      }
    });

    return () => {
      cancelled = true;
      const c = clientRef.current;
      if (c) {
        c.end(true);
        clientRef.current = null;
      }
      setIsConnected(false);
    };
  }, [ingest]);

  return { latest, isConnected, error, receivedAt };
}
