import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FormulationClassroom } from "@/components/FormulationClassroom";
import { createClient } from "@/lib/supabase/server";

export type ClassroomMaterial = {
  id: string;
  common_name: string;
  botanical_name: string | null;
  primary_conditions: string | null;
  functional_roles_text: string | null;
  temperament_analysis: string | null;
  pairings_summary: string | null;
  correspondences_summary: string | null;
  formulation_behavior: string | null;
};

export default async function FormulationClassroomPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .schema("research")
    .from("materials")
    .select(
      "id,common_name,botanical_name,primary_conditions,functional_roles_text,temperament_analysis,pairings_summary,correspondences_summary,formulation_behavior"
    )
    .not("common_name", "ilike", "[SAMPLE%")
    .order("common_name", { ascending: true });

  return (
    <AppShell>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Formulate · Learning laboratory</div>
          <h1>Formulation Classroom</h1>
          <p>
            Learn formulation by making decisions, explaining the job of every material, and
            checking your reasoning against the logic already established in The Rootworker&apos;s Formulary.
          </p>
        </div>
      </section>

      <FormulationClassroom materials={(data ?? []) as ClassroomMaterial[]} />
    </AppShell>
  );
}
