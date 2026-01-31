/**
 * MQTT 센서 구독 스크립트 (장기 실행)
 * 5단계에서 Supabase 저장 연동 예정.
 *
 * 실행: npx tsx scripts/mqtt-subscriber.ts
 * (tsx: npm i -D tsx)
 */

import { config } from "dotenv";
import { runSensorSubscriber } from "../lib/mqtt/subscriber";

config({ path: ".env.local" });

runSensorSubscriber((payload) => {
  console.log("[sensor]", new Date().toISOString(), payload);
  // TODO: 5단계 — Supabase sensor_readings insert
});
