import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/sensor/ingest
 * 센서 데이터 HTTP 수집 (MQTT 구독 스크립트 없이 사용 가능)
 * Body: { temperature?, humidity?, ec?, ph? } (숫자, 최소 1개)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object") {
      return NextResponse.json(
        { error: "Body must be JSON object" },
        { status: 400 }
      );
    }

    const temperature =
      typeof body.temperature === "number" && Number.isFinite(body.temperature)
        ? body.temperature
        : null;
    const humidity =
      typeof body.humidity === "number" && Number.isFinite(body.humidity)
        ? body.humidity
        : null;
    const ec =
      typeof body.ec === "number" && Number.isFinite(body.ec) ? body.ec : null;
    const ph =
      typeof body.ph === "number" && Number.isFinite(body.ph) ? body.ph : null;

    if (temperature === null && humidity === null && ec === null && ph === null) {
      return NextResponse.json(
        { error: "At least one of temperature, humidity, ec, ph required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sensor_readings")
      .insert({
        temperature,
        humidity,
        ec,
        ph,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[API sensor/ingest]", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[API sensor/ingest]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
