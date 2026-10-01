import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function ReadingBookingPage() {
  return (
    <AppShell>
      <div className="booking-shell">
        <nav className="flow-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/work-with-me">Work With Me</Link><span>→</span><strong>Standalone Reading</strong>
        </nav>
        <section className="booking-intro">
          <div className="eyebrow">Standalone reading intake</div>
          <h1>Book a reading without a consultation.</h1>
          <p>This pathway is for divination/readings only. It does not route into consultation intake, self-technology planning, or clinical services.</p>
        </section>

        <section className="intake-panel">
          <div className="intake-grid">
            <div className="intake-field"><label htmlFor="name">Name</label><input id="name" name="name" type="text" /></div>
            <div className="intake-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" /></div>
            <div className="intake-field full"><label htmlFor="question">Question or focus for the reading</label><textarea id="question" name="question_or_focus" /></div>
            <div className="intake-field full"><label htmlFor="context">Relevant context you want included</label><textarea id="context" name="context" /></div>
            <div className="intake-field full"><label htmlFor="avoid">Are there approaches you do not want included?</label><textarea id="avoid" name="approaches_to_avoid" /></div>
          </div>
          <div className="booking-status"><strong>Booking framework is installed.</strong> Duration, price, availability, policies, and payment checkout remain owner-configurable and are not being guessed.</div>
        </section>
      </div>
    </AppShell>
  );
}
