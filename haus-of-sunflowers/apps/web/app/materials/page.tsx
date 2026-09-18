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
  record_status: string;
};

export default async function MaterialsPage() {
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

    const { data, error } = await supabase
      .schema("research")
      .from("materials")
      .select("id,common_name,botanical_name,material_type,material_subtype,documented_use,part_used,plant_family,formulation_behavior,record_status")
      .order("common_name", { ascending: true });

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
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Working materia</div>
          <h1>Materials Library</h1>
          <p>
            Herbs, roots, resins, oils, waters, minerals, curios, and carriers organized by
            what they do inside a formula.
          </p>
        </div>
        <div className="hero-stat">
          <span>Structured materials</span>
          <strong>{configured ? materials.length : "—"}</strong>
        </div>
      </section>

      {errorMessage && <p className="alert">{errorMessage}</p>}

      <section className="filter-rail" aria-label="Material type summary">
        <span className="filter-chip active">All {materials.length || ""}</span>
        {Object.entries(typeCounts).slice(0, 8).map(([type, count]) => (
          <span className="filter-chip" key={type}>{type.replaceAll("_", " ")} · {count}</span>
        ))}
      </section>

      {materials.length === 0 ? (
        <section className="empty-state">
          <div className="empty-symbol" aria-hidden="true">✦</div>
          <h2>The library is ready for the book.</h2>
          <p>
            The data model now supports herbs, roots, resins, carrier oils, infused oils,
            essential oils, waters, curios, minerals, powders, and other material classes.
          </p>
          <a className="primary-cta" href="/import-center">Import The Rootworker&apos;s Formulary</a>
        </section>
      ) : (
        <section className="material-list">
          {materials.map((material) => (
            <article className="material-row" key={material.id}>
              <div className="material-monogram" aria-hidden="true">
                {material.common_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="material-main">
                <div className="material-title-line">
                  <h2>{material.common_name}</h2>
                  <span className="record-pill">{material.record_status.replaceAll("_", " ")}</span>
                </div>
                <p className="botanical-name">{material.botanical_name || "Botanical identity not yet entered"}</p>
                <p className="material-summary">
                  {material.formulation_behavior || material.documented_use || "Ready for structured formulation notes."}
                </p>
              </div>
              <div className="material-meta">
                <span>{(material.material_type || "material").replaceAll("_", " ")}</span>
                {material.part_used && <span>{material.part_used}</span>}
                {material.plant_family && <span>{material.plant_family}</span>}
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
