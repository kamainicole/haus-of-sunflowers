import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const MATERIAL_GROUPS = [
  ["Herbs & Leaves", "Functional behavior, temperament, roles, and application."],
  ["Roots", "Anchoring, directing, drawing, protecting, and fixed work."],
  ["Resins & Incense", "Smoke behavior, fixative qualities, elevation, and cleansing."],
  ["Carrier Oils", "Neutral and active carriers, shelf life, weight, and condition fit."],
  ["Essential Oils", "Concentration, volatility, aroma, and formulation compatibility."],
  ["Waters & Washes", "Baths, floor washes, spiritual waters, and extraction behavior."],
  ["Minerals & Curios", "Non-botanical materials with distinct functions and handling."],
  ["Powders & Bases", "Dusting, contact work, presentation, and structural carriers."],
];

const ROLES = ["Cleanser", "Builder", "Amplifier", "Director", "Blocker", "Returner", "Stabilizer"];

export default function FormularyPage() {
  return (
    <AppShell>
      <section className="page-hero book-hero">
        <div>
          <div className="eyebrow">The interactive book</div>
          <h1>The Rootworker&apos;s Formulary</h1>
          <p>
            Browse the book as a working system: start with the condition, understand what
            each material does, then build with role, temperament, application, and balance.
          </p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/materials">Browse Materials</Link>
            <Link className="secondary-cta" href="/formulas">Open Formula Builder</Link>
          </div>
        </div>
        <aside className="book-spine-card">
          <span>Condition First</span>
          <strong>Meaning describes.<br />Function performs.</strong>
          <p>The app follows the formulation logic of the book instead of flattening materials into correspondence lists.</p>
        </aside>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">Browse the materia</div>
          <h2>Not just herbs.</h2>
        </div>
        <p>Every material class gets its own formulation behavior and application context.</p>
      </section>

      <section className="library-grid">
        {MATERIAL_GROUPS.map(([title, description]) => (
          <Link className="library-card" href="/materials" key={title}>
            <div className="library-card-mark" aria-hidden="true">✦</div>
            <h3>{title}</h3>
            <p>{description}</p>
            <span>Explore →</span>
          </Link>
        ))}
      </section>

      <section className="two-column-feature">
        <article className="feature-panel">
          <div className="eyebrow">Formulation framework</div>
          <h2>Build by role, not by random association.</h2>
          <div className="role-cloud">
            {ROLES.map((role) => <span key={role}>{role}</span>)}
          </div>
          <p>
            A material can fill different roles in different formulas. The app stores those
            roles in context instead of pretending each ingredient has one fixed meaning.
          </p>
        </article>
        <article className="feature-panel research-layer-panel">
          <div className="eyebrow">Bonus layer</div>
          <h2>Historical Research</h2>
          <p>
            Client-facing book content stays primary. Historical sources, archival excerpts,
            regional evidence, contradictions, and research notes sit underneath as the deeper
            evidence layer.
          </p>
          <Link className="text-link" href="/research">Enter the research archive →</Link>
        </article>
      </section>
    </AppShell>
  );
}
