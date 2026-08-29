import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the public anon key — safe to
 * ship to the browser because every table it can reach is protected
 * by Row-Level Security (packages/database/migrations/007_rls_policies.sql).
 * It can never see the `dissertation` or `internal` schemas at all,
 * regardless of RLS, because those schemas aren't in the Data API's
 * exposed schema list (supabase/config.toml) or grants
 * (006_grants.sql).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
