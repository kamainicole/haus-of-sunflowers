"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? "error" : "sent");
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
          <div className="eyebrow">Private archive access</div>
          <h1>Welcome back</h1>
          <p>
            Enter your email and we’ll send a secure sign-in link. No password is required.
          </p>

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

          {status === "sent" && (
            <p className="status-message">Check your email for your sign-in link.</p>
          )}
          {status === "error" && (
            <p className="status-message error">Something went wrong. Please try again.</p>
          )}
        </div>
      </section>
    </main>
  );
}
