import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@haus/shared-types";

const STAT_LABELS: Record<keyof DashboardStats, string> = {
  total_sources: "Sources",
  total_materials: "Materials",
  total_map_records: "Map Records",
  total_claims: "Claims",
  total_people: "People",
  total_practices: "Practices",
  total_dissertation_notes: "Dissertation Notes",
  claims_needing_verification: "Claims Needing Verification",
  cited_claim_links: "Cited Claim Links",
  new_materials_this_month: "New Materials (30d)",
  new_sources_this_month: "New Sources (30d)",
  private_records_materials: "Private Materials",
  published_records_materials: "Published Materials",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // api.dashboard_stats is a security_invoker view — RLS on the
  // underlying research/dissertation tables still applies to this
  // signed-in user's own query.
  const { data: stats, error } = await supabase
    .schema("api")
    .from("dashboard_stats")
    .select("*")
    .single<DashboardStats>();

  return (
    <main className="container">
      <h1>Research Dashboard</h1>
      <p>Signed in as {user.email}</p>

      {error && (
        <p style={{ color: "#a33" }}>
          Could not load dashboard stats yet — this is expected until the
          database migrations have been run against a connected Supabase
          project. ({error.message})
        </p>
      )}

      {stats && (
        <div className="stat-grid">
          {(Object.keys(STAT_LABELS) as (keyof DashboardStats)[]).map((key) => (
            <div className="stat" key={key}>
              <div className="stat-number">{stats[key]}</div>
              <div className="stat-label">{STAT_LABELS[key]}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
