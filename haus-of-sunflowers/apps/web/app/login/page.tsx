"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginStatus = "idle" | "loading" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message === "Invalid login credentials"
          ? "The email or password is incorrect."
          : error.message || "Unable to sign in."
      );
      return;
    }

    const { data: isOwner } = await supabase.schema("research").rpc("am_i_owner");
    window.location.replace(isOwner === true ? "/admin" : "/dashboard");
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
          <p>Sign in with your email and password. Successful sign-in takes you directly into the app.</p>

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

            <label className="field-label" htmlFor="password" style={{ marginTop: 16 }}>Password</label>
            <input
              id="password"
              className="field"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="primary-button" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {status === "error" && (
            <p className="status-message error">{errorMessage}</p>
          )}

          <p style={{ marginTop: 18 }}>
            <Link href="/forgot-password">Forgot or need to set your password?</Link>
          </p>

          <p style={{ marginTop: 18 }}>
            Student? <Link href="/student-access">Use Student Access.</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
