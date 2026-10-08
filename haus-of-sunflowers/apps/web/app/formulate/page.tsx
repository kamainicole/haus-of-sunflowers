import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function FormulatePage() {
  return (
    <AppShell>
      <section className="pathway-hero">
        <div className="eyebrow">Formulate</div>
        <h1>The companion workspace for The Rootworker’s Formulary.</h1>
        <p>Study materia, compare functions, and test formulas using the logic already established in the book. This pathway remains Hoodoo- and formulation-specific.</p>
      </section>

      <section className="pathway-card-grid">
        <Link className="pathway-card" href="/formulary"><span>01</span><h2>The Formulary</h2><p>Enter the book companion and move through its formulation logic.</p><strong>Open Formulary →</strong></Link>
        <Link className="pathway-card" href="/materials"><span>02</span><h2>Materia Library</h2><p>Search herbs, roots, resins, curios, carriers, and related materials by function, role, temperament, pairings, and correspondences.</p><strong>Browse materials →</strong></Link>
        <Link className="pathway-card" href="/formulas"><span>03</span><h2>Formula Builder</h2><p>Test your own formula against the structure and logic already established in the book.</p><strong>Build a formula →</strong></Link>
        <Link className="pathway-card" href="/assistants?tool=formulary_assistant"><span>04</span><h2>Formulary Assistant</h2><p>Ask about materia, roles, temperament, pairings, conditions, and formulation behavior using approved Formulary records only.</p><strong>Ask the Formulary →</strong></Link>
      </section>

      <section className="boundary-note"><strong>Boundary:</strong> formulation tools do not automatically feed personal consultation, psychology, or self-technology workflows.</section>
    </AppShell>
  );
}
