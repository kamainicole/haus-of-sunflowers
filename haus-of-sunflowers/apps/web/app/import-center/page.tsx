import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BookImportCard } from "@/components/BookImportCard";
import { createClient } from "@/lib/supabase/server";

type Batch = {
  id: string;
  title: string | null;
  original_filename: string | null;
  status: string;
  created_at: string;
};

export default async function ImportCenterPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let batches: Batch[] = [];

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data } = await supabase.schema("api").rpc("import_list_batches");
    batches = (data ?? []) as Batch[];
  }

  return (
    <AppShell>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Source ingestion</div>
          <h1>Import Center</h1>
          <p>
            Upload the book or a historical source once. The system stages it, preserves
            provenance, proposes structured records, and keeps uncertain items in review.
          </p>
        </div>
      </section>

      <BookImportCard />

      <section className="import-pipeline">
        <div><span>01</span><strong>Upload</strong><small>Private source file</small></div>
        <div><span>02</span><strong>Extract</strong><small>Pages & sections</small></div>
        <div><span>03</span><strong>Structure</strong><small>Materials, formulas, roles, pairings</small></div>
        <div><span>04</span><strong>Review</strong><small>Only exceptions & ambiguity</small></div>
        <div><span>05</span><strong>Publish</strong><small>Approved records enter the library</small></div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">Import history</div>
          <h2>Staged sources</h2>
        </div>
      </section>

      <section className="batch-list">
        {batches.length === 0 ? (
          <div className="empty-state slim">
            <h2>No staged sources yet.</h2>
            <p>Your uploaded book will appear here with its processing and review status.</p>
          </div>
        ) : batches.map((batch) => (
          <article className="batch-row" key={batch.id}>
            <div>
              <strong>{batch.title || batch.original_filename || "Untitled source"}</strong>
              <span>{batch.original_filename}</span>
            </div>
            <span className="status-badge">{batch.status.replaceAll("_", " ")}</span>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
