import { AppShell } from "@/components/AppShell";

const TECHNOLOGIES = [
  "Breathwork",
  "Mirror work",
  "Journaling",
  "Grounding",
  "Reflective practice",
  "Contemplative practice",
  "Creativity-based exercises",
];

export default function PracticePage() {
  return (
    <AppShell>
      <section className="pathway-hero">
        <div className="eyebrow">Practice</div>
        <h1>Self-technologies for structured work with the self.</h1>
        <p>This area is intentionally separate from the Hoodoo archive and Formulary tools. It is educational and reflective, not therapy or clinical care.</p>
      </section>

      <section className="practice-framework">
        <div className="practice-framework-copy">
          <div className="eyebrow">Practice library structure</div>
          <h2>Each self-technology has the same learning anatomy.</h2>
          <p>Overview, purpose, instructions, recommended frequency, reflection prompts, related resources, limitations or contraindications where appropriate, and research support where applicable.</p>
        </div>
        <div className="practice-chip-grid">
          {TECHNOLOGIES.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="pathway-card-grid two-up">
        <article className="pathway-card static-card"><span>01</span><h2>Practice Library</h2><p>Only practices intentionally added to the app will appear here. No outside material is auto-imported.</p><strong>Content opens as you publish it.</strong></article>
        <a className="pathway-card" href="/assistants?tool=practice_builder"><span>02</span><h2>Practice Builder</h2><p>An AI-assisted organizer assembles approved self-technologies into a personal nonclinical routine using only material already inside the app.</p><strong>Open Practice Builder →</strong></a>
      </section>

      <section className="boundary-note"><strong>Boundary:</strong> the Practice Builder cannot diagnose, provide psychotherapy, create treatment plans, or invent practices that have not been approved and added to this app.</section>
    </AppShell>
  );
}
