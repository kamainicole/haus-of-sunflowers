import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@haus/shared-types";

const PRIMARY_STATS: Array<{ key: keyof DashboardStats; label: string; kicker: string }> = [
  { key: "total_materials", label: "Materials", kicker: "Materia archive" },
  { key: "total_sources", label: "Sources", kicker: "Books & records" },
  { key: "total_people", label: "People", kicker: "Practitioners & informants" },
  { key: "total_practices", label: "Practices", kicker: "Methods & traditions" },
  { key: "total_map_records", label: "Map Records", kicker: "Documented places" },
  { key: "total_claims", label: "Claims", kicker: "Research questions" },
  { key: "new_sources_this_month", label: "New Sources", kicker: "Last 30 days" },
  { key: "new_materials_this_month", label: "New Materials", kicker: "Last 30 days" },
];

export default async function DashboardPage() {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let stats: DashboardStats | null = null;
  let errorMessage: string | null = null;

  if (hasSupabaseConfig) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data, error } = await supabase
      .schema("api")
      .from("dashboard_stats")
      .select("*")
      .single<DashboardStats>();

    stats = data;
    errorMessage = error?.message ?? null;
  }

  return (
    <main className="archive-page">
      <aside className="archive-sidebar">
        <div className="brand-mark">
          <div className="brand-seal" aria-hidden="true">☼</div>
          <div className="brand-name">
            <strong>Haus of Sunflowers</strong>
            <small>Research Archive</small>
          </div>
        </div>

        <nav className="archive-nav" aria-label="Archive navigation">
          <div className="nav-item active"><span className="nav-dot" />Dashboard</div>
          <div className="nav-item"><span className="nav-dot" />Historical Map</div>
          <div className="nav-item"><span className="nav-dot" />Materials</div>
          <div className="nav-item"><span className="nav-dot" />Sources</div>
          <div className="nav-item"><span className="nav-dot" />People</div>
          <div className="nav-item"><span className="nav-dot" />Practices</div>
          <div className="nav-item"><span className="nav-dot" />Terminology</div>
          <div className="nav-item"><span className="nav-dot" />Import Center</div>
          <div className="nav-item"><span className="nav-dot" />Dissertation</div>
        </nav>

        <div className="sidebar-note">
          <p>Black histories.<br />Rooted everywhere.</p>
          <span>Preserve · Research · Reconnect</span>
        </div>
      </aside>

      <section className="archive-main">
        <header className="topbar">
          <div className="eyebrow">People · Places · Practices · Possibilities</div>
          <div className="top-search" aria-label="Archive search preview">Search the archive…</div>
        </header>

        <section className="dashboard-hero">
          <div className="hero-copy">
            <div className="eyebrow">Private scholarly research environment</div>
            <h1>Research Dashboard</h1>
            <p>
              Continue building a source-grounded archive of Hoodoo, conjure, rootwork,
              people, places, materials, practices, and historical evidence.
            </p>
          </div>

          <aside className="hero-quote">
            <div className="eyebrow">Haus of Sunflowers</div>
            <blockquote>
              “Preserve the record. Follow the evidence. Let the archive speak.”
            </blockquote>
            <small>Research principle</small>
          </aside>
        </section>

        {!hasSupabaseConfig && (
          <p className="alert">
            Preview mode: the interface is available for visual review, but this preview deployment is not connected to Supabase. Production data and sign-in remain unchanged.
          </p>
        )}

        {errorMessage && (
          <p className="alert">
            Dashboard statistics are temporarily unavailable. {errorMessage}
          </p>
        )}

        <section className="stat-grid" aria-label="Archive statistics">
          {PRIMARY_STATS.map(({ key, label, kicker }) => (
            <article className="stat-card" key={key}>
              <div className="stat-kicker">{kicker}</div>
              <div className="stat-number">{stats ? stats[key] : "—"}</div>
              <div className="stat-label">{label}</div>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="eyebrow">Workspace</div>
            <h2>Continue the research</h2>
            <div className="quick-grid">
              <div className="quick-action">
                <strong>Import documents</strong>
                <span>Bring source material into the review pipeline.</span>
              </div>
              <div className="quick-action">
                <strong>Review map evidence</strong>
                <span>Trace where practices, people, and materials are documented.</span>
              </div>
              <div className="quick-action">
                <strong>Develop claims</strong>
                <span>Separate evidence, interpretation, and open questions.</span>
              </div>
              <div className="quick-action">
                <strong>Dissertation workspace</strong>
                <span>Keep private academic work separate from archive publication.</span>
              </div>
            </div>
          </article>

          <aside className="panel">
            <div className="eyebrow">Research pulse</div>
            <h2>Archive status</h2>
            <div className="detail-list">
              <div className="detail-row">
                <span>Claims needing verification</span>
                <strong>{stats ? stats.claims_needing_verification : "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Cited claim links</span>
                <strong>{stats ? stats.cited_claim_links : "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Private materials</span>
                <strong>{stats ? stats.private_records_materials : "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Published materials</span>
                <strong>{stats ? stats.published_records_materials : "—"}</strong>
              </div>
              <div className="detail-row">
                <span>Dissertation notes</span>
                <strong>{stats ? stats.total_dissertation_notes : "—"}</strong>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
