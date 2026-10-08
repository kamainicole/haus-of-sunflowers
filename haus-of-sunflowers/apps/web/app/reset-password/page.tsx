"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "loading" | "error";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Verifying your password-reset link…");

  useEffect(() => {
    let cancelled = false;

    async function establishRecoverySession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (cancelled) return;

        if (error) {
          setStatus("error");
          setMessage("This password-reset link is invalid or has expired. Request a new reset link.");
          return;
        }

        window.history.replaceState({}, "", "/reset-password");
        setStatus("ready");
        setMessage("");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setStatus("ready");
        setMessage("");
        return;
      }

      setStatus("error");
      setMessage("This password-reset link is invalid or has expired. Request a new reset link.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setStatus("ready");
        setMessage("");
      }
    });

    void establishRecoverySession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password.length < 8) {
      setStatus("ready");
      setMessage("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("ready");
      setMessage("The passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("ready");
      setMessage(error.message || "Unable to update your password.");
      return;
    }

    const { data: isOwner } = await supabase.schema("research").rpc("am_i_owner");
    window.location.replace(isOwner === true ? "/admin" : "/dashboard");
  }

  const formReady = status === "ready" || status === "loading";

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
            <p>
              The reset link opens this page, verifies the recovery session, and lets you choose
              a new password. Once it is saved, future sign-ins take you directly into the app.
            </p>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">Password recovery</div>
          <h1>Create a new password</h1>

          {status === "checking" && <p className="status-message">{message}</p>}

          {formReady && (
            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="new-password">New password</label>
              <div className="password-field-wrap">
                <input
                  id="new-password"
                  className="field password-field"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span aria-hidden="true">👁</span> {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label className="field-label" htmlFor="confirm-password" style={{ marginTop: 16 }}>
                Confirm password
              </label>
              <div className="password-field-wrap">
                <input
                  id="confirm-password"
                  className="field password-field"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <span aria-hidden="true">👁</span> {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button className="primary-button" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Saving…" : "Save password and enter app"}
              </button>
            </form>
          )}

          {message && status !== "checking" && (
            <p className={status === "error" ? "status-message error" : "status-message"}>
              {message}
            </p>
          )}

          {status === "error" && (
            <p style={{ marginTop: 18 }}>
              <Link href="/forgot-password">Request a new password-reset link</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
