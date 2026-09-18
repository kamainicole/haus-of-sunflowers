import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requireOwner } from "@/lib/auth/isOwner";

export default async function DissertationPage() {
  const { user, isOwner } = await requireOwner();
  if (!user) redirect("/login");
  if (!isOwner) redirect("/dashboard");

  return (
    <AppShell isOwner>
      <section className="page-hero dissertation-hero">
        <div>
          <div className="eyebrow">Owner only · Private by design</div>
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
