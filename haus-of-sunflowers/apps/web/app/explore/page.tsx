import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function ExplorePage() {
  return (
    <AppShell>
      <section className="pathway-hero">
        <div className="eyebrow">Explore</div>
        <h1>Historical research, documentation, place, and evidence.</h1>
        <p>Search the Haus of Sunflowers archive without losing provenance. This pathway keeps historical Hoodoo research distinct from self-technologies, classroom content, consultations, and private dissertation work.</p>
      </section>

      <section className="pathway-card-grid">
        <Link className="pathway-card" href="/research"><span>01</span><h2>Historical Research</h2><p>Search documented practices, people, terminology, claims, ingredients, dates, and archive notes.</p><strong>Open research →</strong></Link>
        <Link className="pathway-card" href="/historical-map"><span>02</span><h2>Historical Map</h2><p>Follow documented places and geographic evidence across the archive.</p><strong>Open map →</strong></Link>
        <Link className="pathway-card" href="/sources"><span>03</span><h2>Sources</h2><p>Move directly into books, archival records, fieldwork, quotations, and provenance.</p><strong>Browse sources →</strong></Link>
        <Link className="pathway-card" href="/assistants?tool=research_search"><span>04</span><h2>Research Search Assistant</h2><p>Ask the archive a question in ordinary language and follow the internal records used to answer it.</p><strong>Ask the archive →</strong></Link>
      </section>

      <section className="boundary-note"><strong>Boundary:</strong> private dissertation records remain outside this public research pathway unless they are intentionally published elsewhere.</section>
    </AppShell>
  );
}
