import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StudentAccessManager } from "@/components/StudentAccessManager";
import { requireOwner } from "@/lib/auth/isOwner";

export default async function StudentsAdminPage() {
  const { user, isOwner } = await requireOwner();
  if (!user) redirect("/login");
  if (!isOwner) redirect("/dashboard");

  return (
    <AppShell isOwner>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Owner only · Access control</div>
          <h1>Students</h1>
          <p>
            Add or remove student access without exposing your dissertation, document uploads,
            Import Center, or owner administration.
          </p>
        </div>
      </section>

      <StudentAccessManager />
    </AppShell>
  );
}
