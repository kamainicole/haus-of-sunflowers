import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: source } = await supabase
    .schema("research")
    .from("sources")
    .select("id,title,author,editor,source_type,publication,publisher,publication_year,isbn,citation,abstract,notes,content_origin")
    .eq("id", id)
    .single();

  if (!source) notFound();

  const { data: links } = await supabase
    .schema("research")
    .from("material_sources")
    .select("id,page_ref,notes,materials(id,common_name,material_type)")
    .eq("source_id", id)
    .order("page_ref", { ascending: true });

  const materialLinks = (links ?? []) as unknown as Array<{
    id: string;
    page_ref: string | null;
    notes: string | null;
    materials: { id: string; common_name: string; material_type: string | null } | null;
  }>;

  return (
    <AppShell>
      <nav className="flow-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/dashboard">Archive</Link><span>→</span>
        <Link href="/sources">Sources</Link><span>→</span>
        <strong>{source.title}</strong>
      </nav>

      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">{String(source.source_type).replaceAll("_", " ")}</div>
          <h1>{source.title}</h1>
          <p>{[source.author, source.publication_year, source.publisher].filter(Boolean).join(" · ")}</p>
        </div>
      </section>

      <div className="source-detail-grid">
        <section className="material-reading-column">
          {source.abstract && <article className="reference-section"><div className="reference-section-number">01</div><div><h2>About this source</h2><p>{source.abstract}</p></div></article>}
          {source.citation && <article className="reference-section"><div className="reference-section-number">02</div><div><h2>Citation</h2><p>{source.citation}</p></div></article>}
          {source.notes && <article className="reference-section"><div className="reference-section-number">03</div><div><h2>Archive notes</h2><p>{source.notes}</p></div></article>}
        </section>

        <aside className="material-connections-column">
          <section className="connection-panel">
            <div className="eyebrow">Records connected to this source</div>
            <h2>Materials</h2>
            {materialLinks.length ? materialLinks.map((link) => (
              link.materials ? (
                <Link className="source-connection" href={`/materials/${link.materials.id}`} key={link.id}>
                  <strong>{link.materials.common_name}</strong>
                  <span>{[(link.materials.material_type || "material").replaceAll("_", " "), link.page_ref && `p. ${link.page_ref}`].filter(Boolean).join(" · ")}</span>
                </Link>
              ) : null
            )) : <p>No material records are linked yet.</p>}
          </section>

          <section className="connection-panel next-path-panel">
            <div className="eyebrow">Keep moving</div>
            <h2>Follow the source</h2>
            <Link href="/materials">Browse Materials →</Link>
            <Link href="/historical-map">Trace Places →</Link>
            <Link href="/research">Open Historical Research →</Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
