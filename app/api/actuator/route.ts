import { NextRequest, NextResponse } from "next/server";
import { publishActuatorCommand } from "@/lib/mqtt/client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ActuatorCode } from "@/types/mqtt";

const VALID_CODES: ActuatorCode[] = ["led", "pump", "fan1", "fan2"];

/**
 * GET /api/actuator
 * 액추에이터 현재 상태 조회 (대시보드용)
 */
export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("actuators")
      .select("id, code, display_name, is_on, updated_at")
      .order("code");

    if (error) {
      console.error("[API actuator GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[API actuator GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

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

    const supabase = createServiceRoleClient();
    const { error: updateError } = await supabase
      .from("actuators")
      .update({ is_on: isOn, updated_at: new Date().toISOString() })
      .eq("code", validCode);

    if (updateError) {
      console.error("[API actuator] Supabase update error:", updateError);
      return NextResponse.json(
        { error: `DB update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: validCode, is_on: isOn });
  } catch (err) {
    console.error("[API actuator]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MQTT publish failed" },
      { status: 500 }
    );
  }
}
