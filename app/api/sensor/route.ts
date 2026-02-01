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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      console.error("[API sensor] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server config: Supabase env not set. Check .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 }
      );
    }

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
      console.error("[API sensor] Supabase error:", error.message, error.code, error.details);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    console.error("[API sensor] Exception:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
