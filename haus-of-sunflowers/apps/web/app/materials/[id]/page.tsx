import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type Material = {
  id: string;
  common_name: string;
  botanical_name: string | null;
  scientific_name: string | null;
  material_type: string | null;
  material_subtype: string | null;
  part_used: string | null;
  plant_family: string | null;
  primary_conditions: string | null;
  functional_roles_text: string | null;
  temperament_analysis: string | null;
  pairings_summary: string | null;
  traditional_associations: string | null;
  correspondences_summary: string | null;
  formulary_notes: string | null;
  formulation_behavior: string | null;
  preparation_notes: string | null;
  safety_notes: string | null;
  shelf_life_notes: string | null;
  record_status: string;
};

type SourceLink = {
  id: string;
  page_ref: string | null;
  notes: string | null;
  sources: {
    id: string;
    title: string;
    author: string | null;
    publication_year: number | null;
  } | null;
};

function splitPairings(value: string | null) {
  if (!value) return [];
  return value.split(/,|;/).map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: materialData } = await supabase
    .schema("research")
    .from("materials")
    .select("id,common_name,botanical_name,scientific_name,material_type,material_subtype,part_used,plant_family,primary_conditions,functional_roles_text,temperament_analysis,pairings_summary,traditional_associations,correspondences_summary,formulary_notes,formulation_behavior,preparation_notes,safety_notes,shelf_life_notes,record_status")
    .eq("id", id)
    .single();

  if (!materialData) notFound();
  const material = materialData as Material;

  const { data: sourceData } = await supabase
    .schema("research")
    .from("material_sources")
    .select("id,page_ref,notes,sources(id,title,author,publication_year)")
    .eq("material_id", id)
    .order("created_at", { ascending: true });

  const sources = (sourceData ?? []) as unknown as SourceLink[];
  const pairings = splitPairings(material.pairings_summary);

  const { data: neighbors } = await supabase
    .schema("research")
    .from("materials")
    .select("id,common_name")
    .not("common_name", "ilike", "[SAMPLE%")
    .order("common_name")
    .limit(320);

  const ordered = (neighbors ?? []) as Array<{ id: string; common_name: string }>;
  const index = ordered.findIndex((item) => item.id === id);
  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  return (
    <AppShell>
      <nav className="flow-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/dashboard">Archive</Link><span>→</span>
        <Link href="/materials">Materials</Link><span>→</span>
        <strong>{material.common_name}</strong>
      </nav>

      <section className="material-detail-hero">
        <div>
          <div className="eyebrow">{(material.material_type || "material").replaceAll("_", " ")}</div>
          <h1>{material.common_name}</h1>
          {(material.botanical_name || material.scientific_name) && (
            <p className="material-latin">{material.botanical_name || material.scientific_name}</p>
          )}
          <p className="material-lede">
            {material.formulary_notes || material.primary_conditions || "Formulary reference entry."}
          </p>
        </div>
        <aside className="material-identity-card">
          <span>Reference profile</span>
          <dl>
            <div><dt>Type</dt><dd>{(material.material_type || "Material").replaceAll("_", " ")}</dd></div>
            {material.material_subtype && <div><dt>Subtype</dt><dd>{material.material_subtype.replaceAll("_", " ")}</dd></div>}
            {material.part_used && <div><dt>Part used</dt><dd>{material.part_used}</dd></div>}
            {material.plant_family && <div><dt>Family</dt><dd>{material.plant_family}</dd></div>}
          </dl>
        </aside>
      </section>

      <section className="reference-flow-strip" aria-label="Continue through the archive">
        <div><small>1 · Read</small><strong>Formulary entry</strong></div>
        <span>→</span>
        <div><small>2 · Connect</small><strong>Pairings + sources</strong></div>
        <span>→</span>
        <Link href={`/formulas?material=${encodeURIComponent(material.common_name)}`}><small>3 · Apply</small><strong>Formula Builder</strong></Link>
      </section>

      <div className="material-detail-grid">
        <section className="material-reading-column">
          {material.primary_conditions && (
            <article className="reference-section">
              <div className="reference-section-number">01</div>
              <div><h2>Conditions</h2><p>{material.primary_conditions}</p></div>
            </article>
          )}
          {material.functional_roles_text && (
            <article className="reference-section">
              <div className="reference-section-number">02</div>
              <div><h2>Roles</h2><p>{material.functional_roles_text}</p></div>
            </article>
          )}
          {material.temperament_analysis && (
            <article className="reference-section">
              <div className="reference-section-number">03</div>
              <div><h2>Temperament</h2><p>{material.temperament_analysis}</p></div>
            </article>
          )}
          {material.traditional_associations && (
            <article className="reference-section">
              <div className="reference-section-number">04</div>
              <div><h2>Traditional Associations</h2><p>{material.traditional_associations}</p></div>
            </article>
          )}
          {material.correspondences_summary && (
            <article className="reference-section">
              <div className="reference-section-number">05</div>
              <div><h2>Correspondences</h2><p>{material.correspondences_summary}</p></div>
            </article>
          )}
          {material.formulary_notes && (
            <article className="reference-section reference-notes">
              <div className="reference-section-number">06</div>
              <div><h2>Formulary Notes</h2><p>{material.formulary_notes}</p></div>
            </article>
          )}
          {material.formulation_behavior && (
            <article className="reference-section"><div className="reference-section-number">07</div><div><h2>Behavior in Formulation</h2><p>{material.formulation_behavior}</p></div></article>
          )}
          {material.preparation_notes && (
            <article className="reference-section"><div className="reference-section-number">08</div><div><h2>Preparation</h2><p>{material.preparation_notes}</p></div></article>
          )}
          {material.safety_notes && (
            <article className="reference-section caution-section"><div className="reference-section-number">!</div><div><h2>Safety Notes</h2><p>{material.safety_notes}</p></div></article>
          )}
        </section>

        <aside className="material-connections-column">
          <section className="connection-panel">
            <div className="eyebrow">Connect the material</div>
            <h2>Pairings</h2>
            {pairings.length ? (
              <div className="pairing-links">
                {pairings.map((pairing) => (
                  <Link href={`/materials?q=${encodeURIComponent(pairing)}`} key={pairing}>{pairing} →</Link>
                ))}
              </div>
            ) : <p>No pairing notes are attached yet.</p>}
          </section>

          <section className="connection-panel">
            <div className="eyebrow">Provenance</div>
            <h2>Sources</h2>
            {sources.length ? sources.map((source) => (
              <Link className="source-connection" href={source.sources ? `/sources/${source.sources.id}` : "/sources"} key={source.id}>
                <strong>{source.sources?.title || "Source record"}</strong>
                <span>{[source.sources?.author, source.sources?.publication_year, source.page_ref && `p. ${source.page_ref}`].filter(Boolean).join(" · ")}</span>
              </Link>
            )) : <p>No source links are attached yet.</p>}
          </section>

          <section className="connection-panel next-path-panel">
            <div className="eyebrow">Keep moving</div>
            <h2>Where next?</h2>
            <Link href={`/formulas?material=${encodeURIComponent(material.common_name)}`}>Use in Formula Builder →</Link>
            <Link href="/materials">Return to Materials →</Link>
            <Link href="/sources">Browse Sources →</Link>
            <Link href="/research">Follow Historical Research →</Link>
          </section>
        </aside>
      </div>

      <nav className="material-neighbor-nav" aria-label="Previous and next materials">
        {previous ? <Link href={`/materials/${previous.id}`}>← {previous.common_name}</Link> : <span />}
        {next ? <Link href={`/materials/${next.id}`}>{next.common_name} →</Link> : <span />}
      </nav>
    </AppShell>
  );
}
