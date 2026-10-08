import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function LearnPage() {
  return (
    <AppShell>
      <section className="pathway-hero">
        <div className="eyebrow">Learn</div>
        <h1>Courses, lessons, exercises, and guided education.</h1>
        <p>The classroom is for material you intentionally publish around self-technologies, spirituality, creativity, reflection, and psychology-informed education.</p>
      </section>

      <section className="pathway-card-grid">
        <article className="pathway-card static-card"><span>01</span><h2>Courses</h2><p>Structured courses with modules, video lessons, downloadable materials, exercises, and recommended next lessons.</p><strong>Only intentionally added classes appear here.</strong></article>
        <article className="pathway-card static-card"><span>02</span><h2>Progress</h2><p>Course enrollment and lesson completion can be tracked without mixing classroom activity into consultations or private research.</p><strong>Progress stays user-specific.</strong></article>
        <Link className="pathway-card" href="/assistants?tool=course_matcher"><span>03</span><h2>Course Matcher</h2><p>Describe what you want to learn and match only against courses and lessons that have actually been published in the app.</p><strong>Find a course →</strong></Link>
        <Link className="pathway-card" href="/community"><span>04</span><h2>Study Commons</h2><p>Continue into the existing community area without replacing it.</p><strong>Open Study Commons →</strong></Link>
      </section>

      <section className="boundary-note"><strong>Boundary:</strong> no external course content is assumed, imported, or generated. Classroom content exists only when you add it.</section>
    </AppShell>
  );
}
