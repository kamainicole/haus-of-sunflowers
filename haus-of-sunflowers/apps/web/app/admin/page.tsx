import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { requireOwner } from "@/lib/auth/isOwner";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ownerState = await requireOwner();
  if (!ownerState.user) redirect("/login");
  if (!ownerState.isOwner) redirect("/dashboard");

  return (
    <AppShell isOwner>
      <section className="page-hero dashboard-product-hero">
        <div>
          <div className="eyebrow">Private workspace</div>
          <h1>Owner Dashboard</h1>
          <p>
            This is your private back end for managing the research archive, dissertation work,
            classes, self-technologies, services, bookings, and the business systems that should
            never appear as ordinary public navigation.
          </p>
        </div>
        <aside className="dashboard-feature-card">
          <div className="feature-number">◆</div>
          <span>Owner only</span>
          <strong>Your private control room.</strong>
          <p>Public-facing pathways stay separate from the tools you use to manage them.</p>
        </aside>
      </section>

      <section className="dashboard-work-grid">
        <article className="dashboard-work-card">
          <div className="eyebrow">Access management</div>
          <h2>Students</h2>
          <p>Add existing students, remove access when needed, and keep owner-only areas off limits.</p>
          <Link href="/admin/students">Manage students →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Research management</div>
          <h2>Import Center</h2>
          <p>Upload sources, review proposed records, resolve duplicates, and promote approved archival evidence.</p>
          <Link href="/import-center">Open Import Center →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Private academic work</div>
          <h2>Dissertation Workspace</h2>
          <p>Keep dissertation projects, research questions, notes, chapters, and linked evidence private.</p>
          <Link href="/dissertation">Open Dissertation →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Self-technologies</div>
          <h2>Practice Library</h2>
          <p>Review the public Practice pathway while the owner publishing tools are being completed.</p>
          <Link href="/practice">Open Practice →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Education</div>
          <h2>Classroom</h2>
          <p>Review the Learn pathway, courses, lessons, and member-facing educational structure.</p>
          <Link href="/learn">Open Classroom →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Services</div>
          <h2>Consultations & Readings</h2>
          <p>Review the service pathways, intake experience, and booking structure before appointments go live.</p>
          <Link href="/work-with-me">Open Services →</Link>
        </article>

        <article className="dashboard-work-card">
          <div className="eyebrow">Public app</div>
          <h2>View Main Hub</h2>
          <p>Move back into the member-facing side without losing access to the owner workspace in the sidebar.</p>
          <Link href="/dashboard">Return to Dashboard →</Link>
        </article>
      </section>
    </AppShell>
  );
}
