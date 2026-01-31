/**
 * MQTT 센서 구독 스크립트 (장기 실행)
 * smartfarm/sensor/readings 구독 → Supabase sensor_readings insert
 *
 * 실행: npx tsx scripts/mqtt-subscriber.ts
 * (tsx: npm i -D tsx)
 */

import { config } from "dotenv";
import { runSensorSubscriber } from "../lib/mqtt/subscriber";
import { createServiceRoleClient } from "../lib/supabase/server";

config({ path: ".env.local" });

const supabase = createServiceRoleClient();

runSensorSubscriber(async (payload) => {
  console.log("[sensor]", new Date().toISOString(), payload);

  const { error } = await supabase.from("sensor_readings").insert({
    temperature: payload.temperature,
    humidity: payload.humidity,
    ec: payload.ec,
    ph: payload.ph,
  });

  if (error) {
    console.error("[sensor] Supabase insert error:", error.message);
  }
});
