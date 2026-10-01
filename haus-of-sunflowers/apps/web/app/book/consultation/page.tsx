import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function ConsultationBookingPage() {
  return (
    <AppShell>
      <div className="booking-shell">
        <nav className="flow-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/work-with-me">Work With Me</Link><span>→</span><strong>Consultation</strong>
        </nav>
        <section className="booking-intro">
          <div className="eyebrow">Consultation intake</div>
          <h1>Tell me what you want to explore.</h1>
          <p>The consultation is one service. A reading can be included or completely declined, and opting out does not change the consultation price. This service is reflective, spiritual, and nonclinical.</p>
        </section>

        <section className="intake-panel">
          <div className="intake-grid">
            <div className="intake-field"><label htmlFor="name">Name</label><input id="name" name="name" type="text" /></div>
            <div className="intake-field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" /></div>
            <div className="intake-field full"><label htmlFor="explore">What do you want to explore?</label><textarea id="explore" name="what_to_explore" /></div>
            <div className="intake-field full"><label htmlFor="outcome">What outcome would make this session useful?</label><textarea id="outcome" name="useful_outcome" /></div>
            <div className="intake-field full"><label htmlFor="focus">Primary focus</label><select id="focus" name="focus_area" defaultValue=""><option value="" disabled>Select one</option><option value="personal_reflection">Personal reflection</option><option value="spirituality">Spirituality</option><option value="life_transition">Life transition</option><option value="creativity">Creativity</option><option value="other">Another nonclinical concern</option></select></div>
            <div className="intake-field full"><span>Reading preference</span><div className="reading-choice"><label><input type="radio" name="include_reading" value="true" defaultChecked /> Include the reading portion of my consultation.</label><label><input type="radio" name="include_reading" value="false" /> I prefer a consultation without a reading. I understand this does not change the consultation price.</label></div></div>
            <div className="intake-field full"><label htmlFor="avoid">Are there approaches you do not want included?</label><textarea id="avoid" name="approaches_to_avoid" /></div>
            <div className="intake-field full"><label htmlFor="context">Anything else you want me to know before we meet?</label><textarea id="context" name="additional_context" /></div>
          </div>
          <div className="booking-status"><strong>Booking framework is installed.</strong> Appointment length, price, availability windows, cancellation terms, and payment checkout are intentionally not invented. Once those owner settings are configured, this intake feeds directly into the consultation booking record.</div>
        </section>
      </div>
    </AppShell>
  );
}
