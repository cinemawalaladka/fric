// ============================================================================
// PPSU FRIC Portal — Supabase Central Configuration & Active Target Fallback
// ============================================================================
// Active Supabase Project: https://llciwljakspuqhyifakp.supabase.co
// Ensures seamless connectivity in development and production (Vercel) even
// if stale/legacy environment variables exist.
// ============================================================================

export const ACTIVE_SUPABASE_URL = "https://llciwljakspuqhyifakp.supabase.co";
export const ACTIVE_SUPABASE_ANON_KEY =
  "sb_publishable_j2sBgYDYNwlXdHMR9dyIfQ_tQDL1gpo";

const STALE_HOSTS = ["pvgkulxvmaagtvqgzzan.supabase.co", "your-project.supabase.co"];

export function getSupabaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!envUrl) return ACTIVE_SUPABASE_URL;

  // If the environment contains any stale/dead project URL, safely fallback
  if (STALE_HOSTS.some((h) => envUrl.includes(h))) {
    return ACTIVE_SUPABASE_URL;
  }
  return envUrl;
}

export function getSupabaseAnonKey(): string {
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!envKey || envKey.includes("your-anon-key") || (envUrl && STALE_HOSTS.some((h) => envUrl.includes(h)))) {
    return ACTIVE_SUPABASE_ANON_KEY;
  }
  return envKey;
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}
