import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export async function GET() {
  const activeUrl = getSupabaseUrl();
  const rawEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET";
  const hasAnonKey = Boolean(getSupabaseAnonKey());
  const hasServiceKey = Boolean(getSupabaseServiceRoleKey());

  let host = "UNKNOWN";
  try {
    host = new URL(activeUrl).host;
  } catch {}

  let connectionStatus = "UNKNOWN";
  let errorMessage: string | null = null;
  let sampleData: any = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("claim_types").select("code").limit(4);
    if (error) {
      connectionStatus = "DB_ERROR";
      errorMessage = error.message;
    } else {
      connectionStatus = "CONNECTED_OK";
      sampleData = data?.map((d: any) => d.code);
    }
  } catch (err: any) {
    connectionStatus = "FETCH_FAILED";
    errorMessage = err?.message || String(err);
    if (err?.cause) {
      errorMessage += ` (Cause: ${JSON.stringify(err.cause)})`;
    }
  }

  return NextResponse.json({
    status: connectionStatus === "CONNECTED_OK" ? "healthy" : "unhealthy",
    supabase: {
      rawEnvUrl,
      activeHost: host,
      expectedHost: "llciwljakspuqhyifakp.supabase.co",
      isTargetProject: host === "llciwljakspuqhyifakp.supabase.co",
      hasAnonKey,
      hasServiceKey,
      connectionStatus,
      errorMessage,
      sampleData,
    },
    timestamp: new Date().toISOString(),
  });
}
