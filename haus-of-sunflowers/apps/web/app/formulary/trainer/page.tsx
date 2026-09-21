import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { FormulationLab } from "@/components/FormulationLab";

export default function FormulationTrainerPage() {
  return (
    <AppShell>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Interactive training</div>
          <h1>Formulation Lab</h1>
          <p>
            Practice condition fit, ingredient role, temperament, and formula balance so the
            logic of formulation becomes easier to recognize and remember.
          </p>
          <div className="hero-actions">
            <Link className="secondary-cta" href="/formulary">Back to Formulary</Link>
            <Link className="secondary-cta" href="/formulas">Open Formula Builder</Link>
          </div>
        </div>
      </section>

      <FormulationLab />
    </AppShell>
  );
}
