/**
 * MQTT 클라이언트 — 발행(publish) 유틸
 * API Route 등 서버 전용. Vercel Serverless에서 요청별 연결·발행 후 종료.
 * .env.local: wss://host:8884/mqtt 형식 사용
 */

import mqtt, { MqttClient } from "mqtt";
import { getBrokerUrl } from "./broker-url";
import { MQTT_TOPICS } from "@/config/mqtt-topics";
import type { ActuatorCommandPayload } from "@/types/mqtt";

function createClient(): MqttClient {
  return mqtt.connect(getBrokerUrl(), {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID ?? "smartfarm-web-api",
    clean: true,
    reconnectPeriod: 0,
    connectTimeout: 15000,
  });
}

/**
 * 액추에이터 제어 명령 publish
 */
export function publishActuatorCommand(
  payload: ActuatorCommandPayload
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = createClient();

    client.on("error", (err) => {
      client.end(true);
      reject(err);
    });

    client.on("connect", () => {
      const json = JSON.stringify(payload);
      client.publish(MQTT_TOPICS.ACTUATOR_COMMAND, json, { qos: 1 }, (err) => {
        if (err) {
          client.end(true);
          reject(err);
          return;
        }
        client.end(true);
        resolve();
      });
    });
  });
}
