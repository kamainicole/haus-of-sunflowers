"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AccessStatus = "idle" | "sent" | "error";

export default function StudentAccessPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const supabase = createClient();

    const { data: allowed, error: accessError } = await supabase
      .schema("api")
      .rpc("student_access_allowed", { p_email: cleanEmail });

    if (accessError) {
      setStatus("error");
      setMessage(accessError.message);
      return;
    }

    if (!allowed) {
      setStatus("error");
      setMessage("This email has not been added for student access.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Unable to send the student sign-in link.");
      return;
    }

    setStatus("sent");
    setMessage("Check your email for your secure student sign-in link.");
  }

  return (
    <main className="login-page">
      <section className="login-wrap">
        <div className="login-brand">
          <div>
            <div className="brand-mark" style={{ borderBottomColor: "rgba(184,148,69,.28)" }}>
              <div className="brand-seal" aria-hidden="true">☼</div>
              <div className="brand-name">
                <strong>Haus of Sunflowers</strong>
                <small>Student Access</small>
              </div>
            </div>

            <h2>Your learning space.</h2>
            <p>
              Student access includes the Haus of Sunflowers research, Formulary companion,
              materia, formulation tools, Practice, Learn, and other member-facing areas.
            </p>
          </div>

          <div className="sidebar-note" style={{ borderTopColor: "rgba(184,148,69,.28)" }}>
            <p>Research.<br />Formulate. Learn.</p>
            <span>Student member access</span>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">Student access</div>
          <h1>Enter the classroom hub</h1>
          <p>
            Use the email your instructor added for student access. Dissertation, source uploads,
            and owner tools are not available to student accounts.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="student-email">Email address</label>
            <input
              id="student-email"
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
            <button className="primary-button" type="submit">Send student sign-in link</button>
          </form>

          {status !== "idle" && (
            <p className={status === "error" ? "status-message error" : "status-message"}>
              {message}
            </p>
          )}

          <p style={{ marginTop: 18 }}>
            Already have an owner or regular account? <Link href="/login">Use the regular sign-in page.</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
