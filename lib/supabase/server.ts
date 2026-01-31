/**
 * Supabase 서버 전용 클라이언트 (service_role)
 * API Routes, MQTT 구독 스크립트 등 서버·스크립트에서 사용.
 * RLS 우회, INSERT/UPDATE/DELETE 가능.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const createServiceRoleClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
