import { NextRequest, NextResponse } from "next/server";
import { publishActuatorCommand } from "@/lib/mqtt/client";
import type { ActuatorCode } from "@/types/mqtt";

const VALID_CODES: ActuatorCode[] = ["led", "pump", "fan1", "fan2"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, is_on } = body;

    if (!code || typeof code !== "string" || !VALID_CODES.includes(code as ActuatorCode)) {
      return NextResponse.json(
        { error: "Invalid code. Use: led, pump, fan1, fan2" },
        { status: 400 }
      );
    }

    const isOn = typeof is_on === "boolean" ? is_on : true;
    const validCode = code as ActuatorCode;

    await publishActuatorCommand({
      code: validCode,
      is_on: isOn,
    });

    return NextResponse.json({ code: validCode, is_on: isOn });
  } catch (err) {
    console.error("[API actuator]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MQTT publish failed" },
      { status: 500 }
    );
  }
}
