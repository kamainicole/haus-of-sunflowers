import { AppShell } from "@/components/AppShell";

export default function DissertationPage() {
  return (
    <AppShell>
      <section className="page-hero dissertation-hero">
        <div>
          <div className="eyebrow">Private by design</div>
          <h1>Dissertation Workspace</h1>
          <p>
            Academic notes, chapters, claims, and source links remain structurally separate
            from client-facing formulary content and member research.
          </p>
        </div>
      </section>

      <section className="empty-state">
        <div className="empty-symbol" aria-hidden="true">□</div>
        <h2>This workspace stays private.</h2>
        <p>The database isolation is already in place. The richer writing and source-linking interface comes after the formulary core.</p>
      </section>
    </AppShell>
  );
}
