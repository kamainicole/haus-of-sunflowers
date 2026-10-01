import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function WorkWithMePage() {
  return (
    <AppShell>
      <section className="pathway-hero">
        <div className="eyebrow">Work With Me</div>
        <h1>Consultations and standalone readings.</h1>
        <p>Personal services live here without turning the research archive, Formulary tools, classroom, or self-technology library into consultation content.</p>
      </section>

      <section className="service-path-grid">
        <Link className="service-path-card" href="/book/consultation">
          <div className="eyebrow">Consultation</div>
          <h2>Reflective, spiritual, and life-focused consultation</h2>
          <p>Explore a nonclinical concern such as personal reflection, spirituality, a life transition, or creativity. A reading may be included or completely declined. Opting out does not create a different service.</p>
          <strong>Consultation intake →</strong>
        </Link>
        <Link className="service-path-card" href="/book/reading">
          <div className="eyebrow">Standalone reading</div>
          <h2>Book a reading without a consultation</h2>
          <p>For people who want divination or a reading on its own, without entering the consultation pathway.</p>
          <strong>Reading intake →</strong>
        </Link>
      </section>

      <section className="boundary-note"><strong>Scope:</strong> services are educational, reflective, and spiritual. They are not psychotherapy, diagnosis, psychological treatment, or clinical care.</section>
    </AppShell>
  );
}
