import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type Source = {
  id: string;
  title: string;
  author: string | null;
  source_type: string;
  publication_year: number | null;
  content_origin: string | null;
};

export default async function SourcesPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  let sources: Source[] = [];

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data } = await supabase
      .schema("research")
      .from("sources")
      .select("id,title,author,source_type,publication_year,content_origin")
      .order("title");

    sources = (data ?? []) as Source[];
  }

  return (
    <AppShell>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Provenance first</div>
          <h1>Sources</h1>
          <p>
            The book, archival records, scholarship, interviews, and historical collections
            supporting every structured record.
          </p>
        </div>
      </section>

      <section className="source-list">
        {sources.length === 0 ? (
          <div className="empty-state slim">
            <h2>Your source library is ready.</h2>
            <p>Import the book first, then historical sources can be attached as the deeper research layer.</p>
          </div>
        ) : sources.map((source) => (
          <article className="source-row" key={source.id}>
            <div>
              <div className="eyebrow">{source.source_type.replaceAll("_", " ")}</div>
              <h3>{source.title}</h3>
              <p>{[source.author, source.publication_year].filter(Boolean).join(" · ")}</p>
            </div>
            <span className="record-pill">{(source.content_origin || "unclassified").replaceAll("_", " ")}</span>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
