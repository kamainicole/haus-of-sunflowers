import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/isOwner";
import type { DashboardStats } from "@haus/shared-types";

const PRIMARY_STATS: Array<{ key: keyof DashboardStats; label: string; kicker: string }> = [
  { key: "total_materials", label: "Materials", kicker: "Formulary library" },
  { key: "total_sources", label: "Sources", kicker: "Book + archive" },
  { key: "total_practices", label: "Practices", kicker: "Methods & applications" },
  { key: "total_map_records", label: "Locations", kicker: "Historical evidence" },
];

export default async function DashboardPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let stats: DashboardStats | null = null;
  let errorMessage: string | null = null;
  let isOwner = false;

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const ownerState = await requireOwner();
    isOwner = ownerState.isOwner;

    const { data, error } = await supabase
      .schema("api")
      .from("dashboard_stats")
      .select("*")
      .single<DashboardStats>();

    stats = data;
    errorMessage = error?.message ?? null;
  }

  return (
    <AppShell isOwner={isOwner}>
      <section className="page-hero dashboard-product-hero">
        <div>
          <div className="eyebrow">The Rootworker&apos;s Formulary · Living Archive</div>
          <h1>Enter the archive. Follow what connects.</h1>
          <p>
            Begin with formulation, then wander outward through materials, practices, people,
            places, sources, and historical evidence. Every path should preserve provenance while
            still leaving room for discovery.
          </p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/formulary">Enter the Formulary</Link>
            <Link className="secondary-cta" href="/historical-map">Explore the Map</Link>
            {isOwner && <Link className="secondary-cta" href="/import-center">Bring in a Source</Link>}
          </div>
        </div>
        <aside className="dashboard-feature-card">
          <div className="feature-number">01</div>
          <span>Begin anywhere</span>
          <strong>Let the archive lead you.</strong>
          <p>Move from a material to a practice, from a source to a place, or from a question to the evidence that can actually answer it.</p>
        </aside>
      </section>

      {!configured && (
        <p className="alert">Preview mode is showing the interface without production data.</p>
      )}
      {errorMessage && <p className="alert">{errorMessage}</p>}

      <section className="stat-grid product-stats">
        {PRIMARY_STATS.map(({ key, label, kicker }) => (
          <article className="stat-card" key={key}>
            <div className="stat-kicker">{kicker}</div>
            <div className="stat-number">{stats ? stats[key] : "—"}</div>
            <div className="stat-label">{label}</div>
          </article>
        ))}
      </section>

      <section className="archive-discovery" aria-labelledby="discovery-title">
        <div className="archive-discovery-header">
          <div>
            <div className="eyebrow">Ways into the archive</div>
            <h2 id="discovery-title">Choose a thread and follow it.</h2>
          </div>
          <p>
            This space is built for wandering with purpose. Start where your curiosity is strongest,
            then let linked evidence move you across the archive.
          </p>
        </div>
        <div className="discovery-paths">
          <Link className="discovery-path" href="/materials">
            <span>Botanical path</span>
            <strong>Begin with a material</strong>
            <p>Trace role, temperament, applications, pairings, sources, and related practices.</p>
          </Link>
          <Link className="discovery-path" href="/historical-map">
            <span>Geographic path</span>
            <strong>Begin with a place</strong>
            <p>Explore where evidence appears and how records connect across regions and time.</p>
          </Link>
          <Link className="discovery-path" href="/sources">
            <span>Source path</span>
            <strong>Begin with the record</strong>
            <p>Enter through books and archives, then move into the people, claims, and practices they document.</p>
          </Link>
        </div>
      </section>

      <section className="dashboard-work-grid">
        <article className="dashboard-work-card book-card">
          <div className="eyebrow">Book content</div>
          <h2>The Formulary</h2>
          <p>Browse ingredients, oils, resins, carriers, waters, powders, roles, temperaments, pairings, and applications.</p>
          <Link href="/formulary">Open interactive book →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Build</div>
          <h2>Formula Builder</h2>
          <p>Move from condition to roles to ingredients, then check balance and application.</p>
          <Link href="/formulas">Build a formula →</Link>
        </article>

        {isOwner && (
          <article className="dashboard-work-card">
            <div className="eyebrow">Owner tools</div>
            <h2>Import Center</h2>
            <p>Bring books and research sources into the archive, review proposed records, and promote only what you approve.</p>
            <Link href="/import-center">Open private imports →</Link>
          </article>
        )}

        <article className="dashboard-work-card research-card">
          <div className="eyebrow">Deep research</div>
          <h2>Historical Research</h2>
          <p>Follow archival evidence, people, places, regional patterns, and unresolved questions without flattening interpretation into fact.</p>
          <Link href="/research">Go deeper →</Link>
        </article>

        {isOwner && (
          <article className="dashboard-work-card">
            <div className="eyebrow">Private work</div>
            <h2>Dissertation Workspace</h2>
            <p>Keep academic notes, research questions, and chapter work entirely separate from member-facing content.</p>
            <Link href="/dissertation">Open private dissertation →</Link>
          </article>
        )}
      </section>
    </AppShell>
  );
}
