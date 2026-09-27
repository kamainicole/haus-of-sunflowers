import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type Material = {
  id: string;
  common_name: string;
  botanical_name: string | null;
  material_type: string | null;
  material_subtype: string | null;
  documented_use: string | null;
  part_used: string | null;
  plant_family: string | null;
  formulation_behavior: string | null;
  primary_conditions: string | null;
  formulary_notes: string | null;
  record_status: string;
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim();
  const selectedType = (params.type ?? "").trim();

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let materials: Material[] = [];
  let errorMessage: string | null = null;

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    let request = supabase
      .schema("research")
      .from("materials")
      .select("id,common_name,botanical_name,material_type,material_subtype,documented_use,part_used,plant_family,formulation_behavior,primary_conditions,formulary_notes,record_status")
      .not("common_name", "ilike", "[SAMPLE%")
      .order("common_name", { ascending: true });

    if (selectedType) request = request.eq("material_type", selectedType);
    if (query) {
      request = request.or(
        `common_name.ilike.%${query}%,botanical_name.ilike.%${query}%,primary_conditions.ilike.%${query}%`
      );
    }

    const { data, error } = await request;
    materials = (data ?? []) as Material[];
    errorMessage = error?.message ?? null;
  }

  const typeCounts = materials.reduce<Record<string, number>>((acc, material) => {
    const type = material.material_type || material.material_subtype || "Unclassified";
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <nav className="flow-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/dashboard">Archive</Link><span>→</span><strong>Materials Library</strong>
      </nav>

      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Working materia</div>
          <h1>Materials Library</h1>
          <p>
            Open any herb, root, resin, oil, water, mineral, or curio to read its full formulary
            entry, then continue into pairings, sources, or formula building.
          </p>
        </div>
        <div className="hero-stat">
          <span>Visible materials</span>
          <strong>{configured ? materials.length : "—"}</strong>
        </div>
      </section>

      {errorMessage && <p className="alert">{errorMessage}</p>}

      <form className="material-browser-tools" action="/materials" method="get">
        <label>
          <span>Search the materia</span>
          <input name="q" defaultValue={query} placeholder="Search root, herb, condition…" />
        </label>
        <label>
          <span>Material type</span>
          <select name="type" defaultValue={selectedType}>
            <option value="">All material types</option>
            {Object.keys(typeCounts).sort().map((type) => (
              <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">Browse</button>
        {(query || selectedType) && <Link className="secondary-cta" href="/materials">Clear</Link>}
      </form>

      <section className="filter-rail" aria-label="Material type summary">
        <Link className={!selectedType ? "filter-chip active" : "filter-chip"} href="/materials">All</Link>
        {Object.entries(typeCounts).slice(0, 10).map(([type, count]) => (
          <Link
            className={selectedType === type ? "filter-chip active" : "filter-chip"}
            href={`/materials?type=${encodeURIComponent(type)}`}
            key={type}
          >
            {type.replaceAll("_", " ")} · {count}
          </Link>
        ))}
      </section>

      {materials.length === 0 ? (
        <section className="empty-state">
          <div className="empty-symbol" aria-hidden="true">✦</div>
          <h2>No materials match this path.</h2>
          <p>Try a different name, condition, or material type.</p>
          <Link className="primary-cta" href="/materials">Return to all materials</Link>
        </section>
      ) : (
        <section className="material-list">
          {materials.map((material) => (
            <Link className="material-row material-row-link" href={`/materials/${material.id}`} key={material.id}>
              <div className="material-monogram" aria-hidden="true">
                {material.common_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="material-main">
                <div className="material-title-line">
                  <h2>{material.common_name}</h2>
                  <span className="record-pill">{material.record_status.replaceAll("_", " ")}</span>
                </div>
                <p className="botanical-name">{material.botanical_name || "Formulary material"}</p>
                <p className="material-summary">
                  {material.formulary_notes || material.primary_conditions || material.formulation_behavior || material.documented_use || "Open the full reference entry."}
                </p>
              </div>
              <div className="material-meta">
                <span>{(material.material_type || "material").replaceAll("_", " ")}</span>
                {material.part_used && <span>{material.part_used}</span>}
                <span className="open-record-cue">Open entry →</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppShell>
  );
}
