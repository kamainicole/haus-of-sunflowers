"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "sent" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Unable to send the password reset email.");
      return;
    }

    setStatus("sent");
    setMessage("Check your email once to set a new password. After that, normal sign-in does not require an email link.");
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
                <small>Account Access</small>
              </div>
            </div>
            <h2>Reset it once.</h2>
            <p>
              Password recovery uses email only when you forget or need to set a password.
              Regular sign-in uses your email and password and takes you directly into the app.
            </p>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">Password recovery</div>
          <h1>Set or reset your password</h1>
          <p>Enter the email attached to your account.</p>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="recovery-email">Email address</label>
            <input
              id="recovery-email"
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send password reset"}
            </button>
          </form>

          {status !== "idle" && status !== "loading" && (
            <p className={status === "error" ? "status-message error" : "status-message"}>{message}</p>
          )}

          <p style={{ marginTop: 18 }}><Link href="/login">Back to sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
