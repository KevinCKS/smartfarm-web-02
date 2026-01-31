/**
 * 액추에이터 발행 테스트 스크립트
 * 실행: npm run mqtt:publish
 * (또는 npx tsx scripts/test-publish-actuator.ts)
 */

import { config } from "dotenv";
import { publishActuatorCommand } from "../lib/mqtt/client";

config({ path: ".env.local" });

const code = process.argv[2] ?? "led";
const isOn = process.argv[3] !== "false";

publishActuatorCommand({ code: code as "led" | "pump" | "fan1" | "fan2", is_on: isOn })
  .then(() => console.log(`Published: ${code} = ${isOn}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
