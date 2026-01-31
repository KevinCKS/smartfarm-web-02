import { spawn } from "child_process";
import { NextResponse } from "next/server";

/**
 * POST /api/subscriber/start
 * 로컬 개발(npm run dev)에서만: MQTT 구독 스크립트를 자식 프로세스로 시작.
 * Vercel 등 서버리스에서는 동작하지 않음 — 운영 시에는 Railway 등에서 mqtt:subscribe 상시 실행.
 */

let subscriberChild: { exitCode: number | null } | null = null;

function startSubscriber(): { started: boolean; message: string } {
  if (subscriberChild && subscriberChild.exitCode === null) {
    return { started: false, message: "already running" };
  }
  const cwd = process.cwd();
  const child = spawn("npx", ["tsx", "scripts/mqtt-subscriber.ts"], {
    stdio: "inherit",
    shell: true,
    cwd,
    env: { ...process.env, FORCE_COLOR: "1" },
    detached: true,
  });
  subscriberChild = child;
  child.on("exit", () => {
    subscriberChild = null;
  });
  child.unref();
  return { started: true, message: "subscriber started" };
}

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error: "development_only",
        message:
          "구독 스크립트 시작은 로컬 개발(npm run dev)에서만 가능합니다. Vercel에서는 동작하지 않습니다. 운영 시 Railway·Render 등에서 npm run mqtt:subscribe 를 상시 실행하세요.",
      },
      { status: 503 }
    );
  }
  try {
    const result = startSubscriber();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Spawn failed";
    return NextResponse.json(
      { error: "spawn_failed", message },
      { status: 500 }
    );
  }
}
