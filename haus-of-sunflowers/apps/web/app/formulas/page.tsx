import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

type Formula = {
  id: string;
  name: string;
  condition_name: string;
  formula_type: string | null;
  application_method: string | null;
  record_status: string;
};

export default async function FormulasPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let formulas: Formula[] = [];

  if (configured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data } = await supabase
      .schema("research")
      .from("formulas")
      .select("id,name,condition_name,formula_type,application_method,record_status")
      .order("updated_at", { ascending: false });

    formulas = (data ?? []) as Formula[];
  }

  return (
    <AppShell>
      <section className="page-hero formula-hero">
        <div>
          <div className="eyebrow">Condition → role → material → balance</div>
          <h1>Formula Builder</h1>
          <p>
            Turn the book&apos;s formulation template into a living workspace. The condition
            comes first; ingredients earn their place by function.
          </p>
        </div>
        <button className="primary-cta" type="button">＋ New Formula</button>
      </section>

      <section className="builder-preview">
        <div className="builder-step active"><span>1</span><strong>Condition</strong><small>Name what must change</small></div>
        <div className="builder-step"><span>2</span><strong>Roles</strong><small>Define the jobs required</small></div>
        <div className="builder-step"><span>3</span><strong>Materials</strong><small>Select by function</small></div>
        <div className="builder-step"><span>4</span><strong>Balance</strong><small>Read temperament & structure</small></div>
        <div className="builder-step"><span>5</span><strong>Application</strong><small>Choose the right vehicle</small></div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">Your workspace</div>
          <h2>Saved formulas</h2>
        </div>
        <p>Published examples and private experiments live in the same system without being confused with historical evidence.</p>
      </section>

      {formulas.length === 0 ? (
        <section className="empty-state slim">
          <h2>No formulas have been structured yet.</h2>
          <p>The sample formulas from the book will populate here after book ingestion.</p>
        </section>
      ) : (
        <section className="formula-grid">
          {formulas.map((formula) => (
            <article className="formula-card" key={formula.id}>
              <div className="eyebrow">{formula.formula_type || "Formula"}</div>
              <h3>{formula.name}</h3>
              <p>{formula.condition_name}</p>
              <div className="formula-card-footer">
                <span>{formula.application_method || "Application not set"}</span>
                <span>{formula.record_status.replaceAll("_", " ")}</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
