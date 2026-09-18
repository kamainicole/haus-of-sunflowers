import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function ResearchPage() {
  return (
    <AppShell>
      <section className="page-hero research-hero">
        <div>
          <div className="eyebrow">Bonus material for deeper study</div>
          <h1>Historical Research</h1>
          <p>
            Go beneath the book into source excerpts, historical locations, regional patterns,
            terminology, people, conflicting evidence, and the questions still being investigated.
          </p>
        </div>
      </section>

      <section className="research-menu">
        <Link href="/sources"><strong>Source Archive</strong><span>Books, WPA material, fieldwork, scholarship, and archival records →</span></Link>
        <Link href="/historical-map"><strong>Historical Map</strong><span>See where evidence is documented and how it changes over time →</span></Link>
        <div><strong>Claims & Questions</strong><span>Track what the evidence supports, contests, or leaves unresolved.</span></div>
        <div><strong>People & Terminology</strong><span>Connect practitioners, informants, collectors, names, and changing language.</span></div>
      </section>
    </AppShell>
  );
}
