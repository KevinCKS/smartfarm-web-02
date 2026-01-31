/**
 * MQTT 구독(subscribe) 유틸
 * 장기 실행 프로세스 전용. .env.local: wss://host:8884/mqtt 형식 사용
 */

import mqtt, { MqttClient } from "mqtt";
import { getBrokerUrl } from "./broker-url";
import { MQTT_TOPICS } from "@/config/mqtt-topics";
import type { SensorReadingsPayload } from "@/types/mqtt";

export type SensorReadingsCallback = (payload: SensorReadingsPayload) => void;

/**
 * smartfarm/sensor/readings 구독 시작
 */
export function runSensorSubscriber(
  onMessage: SensorReadingsCallback
): MqttClient {
  const client = mqtt.connect(getBrokerUrl(), {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID
      ? `${process.env.MQTT_CLIENT_ID}-sub`
      : "smartfarm-web-subscriber",
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 15000,
  });

  client.on("connect", () => {
    client.subscribe(MQTT_TOPICS.SENSOR_READINGS, (err) => {
      if (err) console.error("[MQTT] subscribe error:", err);
    });
  });

  client.on("message", (topic, buffer) => {
    if (topic !== MQTT_TOPICS.SENSOR_READINGS) return;
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
        onMessage({ temperature, humidity, ec, ph });
      }
    } catch {
      // ignore parse error
    }
  });

  client.on("error", (err) => {
    console.error("[MQTT] error:", err);
  });

  return client;
}
