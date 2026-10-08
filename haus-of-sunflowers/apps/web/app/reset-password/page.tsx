"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("The passwords do not match.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message || "Unable to update your password.");
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
                <small>Account Access</small>
              </div>
            </div>
            <h2>Choose your password.</h2>
            <p>Once it is saved, future sign-ins take you directly into the app without waiting for a sign-in email.</p>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">Password setup</div>
          <h1>Create a new password</h1>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              className="field"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <label className="field-label" htmlFor="confirm-password" style={{ marginTop: 16 }}>Confirm password</label>
            <input
              id="confirm-password"
              className="field"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button className="primary-button" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Saving…" : "Save password and enter app"}
            </button>
          </form>

          {status === "error" && <p className="status-message error">{message}</p>}
        </div>
      </section>
    </main>
  );
}
