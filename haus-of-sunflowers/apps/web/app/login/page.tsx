"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginStatus = "idle" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message || "Unable to send the secure sign-in link.");
      return;
    }

    setStatus("sent");
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
                <small>Research Archive</small>
              </div>
            </div>

            <h2>History lives here.</h2>
            <p>
              A private research environment for preserving sources, tracing evidence,
              documenting people and places, and building a rigorous archive of Hoodoo,
              conjure, rootwork, and Black spiritual history.
            </p>
          </div>

          <div className="sidebar-note" style={{ borderTopColor: "rgba(184,148,69,.28)" }}>
            <p>Black histories.<br />Rooted everywhere.</p>
            <span>Preserve · Research · Reconnect</span>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">Secure access</div>
          <h1>Welcome back</h1>
          <p>Enter the email already attached to your Haus of Sunflowers account. We’ll send a secure sign-in link.</p>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="primary-button" type="submit">Send secure sign-in link</button>
          </form>

          {status === "sent" && <p className="status-message">Check your email for your secure sign-in link.</p>}
          {status === "error" && (
            <p className="status-message error">{errorMessage}</p>
          )}

          <p style={{ marginTop: 18 }}>
            Student? <a href="/student-access">Use Student Access.</a>
          </p>
        </div>
      </section>
    </main>
  );
}
