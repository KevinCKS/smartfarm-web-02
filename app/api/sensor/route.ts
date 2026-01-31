import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * GET /api/sensor
 * 최근 센서 데이터 조회 (대시보드용)
 * Query: ?limit=50 (기본 100, 최대 500)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get("limit");
    const limit = Math.min(
      Math.max(1, parseInt(rawLimit ?? "", 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("id, created_at, temperature, humidity, ec, ph")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[API sensor]", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[API sensor]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
