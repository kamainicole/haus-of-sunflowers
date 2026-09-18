import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
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

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    <AppShell>
      <section className="page-hero dashboard-product-hero">
        <div>
          <div className="eyebrow">The Rootworker&apos;s Formulary · Extended</div>
          <h1>Your working formulation archive.</h1>
          <p>
            Use the book as the foundation, then move outward into materials, formulas,
            personal observations, sources, and historical evidence without losing where
            any piece of information came from.
          </p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/formulary">Enter the Formulary</Link>
            <Link className="secondary-cta" href="/import-center">Import the Book</Link>
          </div>
        </div>
        <aside className="dashboard-feature-card">
          <div className="feature-number">01</div>
          <span>Start here</span>
          <strong>Condition first.</strong>
          <p>Build from function, role, temperament, balance, and application rather than a flat list of correspondences.</p>
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

        <article className="dashboard-work-card">
          <div className="eyebrow">Ingest</div>
          <h2>Import Center</h2>
          <p>Upload the book and research sources once. Keep source, page, and evidence attached to what gets extracted.</p>
          <Link href="/import-center">Open imports →</Link>
        </article>

        <article className="dashboard-work-card research-card">
          <div className="eyebrow">Bonus layer</div>
          <h2>Historical Research</h2>
          <p>Follow archival evidence, people, places, regional patterns, and unresolved questions without crowding the client-facing book experience.</p>
          <Link href="/research">Go deeper →</Link>
        </article>
      </section>
    </AppShell>
  );
}
