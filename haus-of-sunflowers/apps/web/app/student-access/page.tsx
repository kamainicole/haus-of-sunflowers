"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "create";
type AccessStatus = "idle" | "loading" | "sent" | "error";

export default function StudentAccessPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [message, setMessage] = useState("");

  async function checkAllowed(cleanEmail: string) {
    const supabase = createClient();
    const { data: allowed, error } = await supabase
      .schema("api")
      .rpc("student_access_allowed", { p_email: cleanEmail });

    if (error) throw error;
    return Boolean(allowed);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const supabase = createClient();

    try {
      const allowed = await checkAllowed(cleanEmail);

      if (!allowed) {
        setStatus("error");
        setMessage("This email has not been added for student access.");
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setStatus("error");
          setMessage(
            error.message === "Invalid login credentials"
              ? "The email or password is incorrect. If this is your first visit, choose Create student account."
              : error.message || "Unable to sign in."
          );
          return;
        }

        window.location.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message || "Unable to create the student account.");
        return;
      }

      if (data.session) {
        window.location.replace("/dashboard");
        return;
      }

      setStatus("sent");
      setMessage(
        "Your student account was created. If email confirmation is required for this first setup, confirm it once. After that, future sign-ins use your password and go directly into the app."
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to verify student access.");
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setMessage("");
    setPassword("");
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
          <h1>{mode === "signin" ? "Enter the classroom hub" : "Create your student account"}</h1>
          <p>
            {mode === "signin"
              ? "Use your approved student email and password. You will enter the app immediately after a successful sign-in."
              : "Use the email your instructor approved, then create the password you will use for future sign-ins."}
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button
              type="button"
              className={mode === "signin" ? "primary-button" : "secondary-cta"}
              onClick={() => changeMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "create" ? "primary-button" : "secondary-cta"}
              onClick={() => changeMode("create")}
            >
              Create account
            </button>
          </div>

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

            <label className="field-label" htmlFor="student-password" style={{ marginTop: 16 }}>
              Password
            </label>
            <input
              id="student-password"
              className="field"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button className="primary-button" type="submit" disabled={status === "loading"}>
              {status === "loading"
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create student account"}
            </button>
          </form>

          {status !== "idle" && status !== "loading" && (
            <p className={status === "error" ? "status-message error" : "status-message"}>
              {message}
            </p>
          )}

          {mode === "signin" && (
            <p style={{ marginTop: 18 }}>
              <Link href="/forgot-password">Forgot your password?</Link>
            </p>
          )}

          <p style={{ marginTop: 18 }}>
            Owner or regular account? <Link href="/login">Use the regular sign-in page.</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
