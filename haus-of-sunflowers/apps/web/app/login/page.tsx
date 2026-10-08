"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "create";
type LoginStatus = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [message, setMessage] = useState("");

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setStatus("idle");
    setMessage("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(
          error.message === "Invalid login credentials"
            ? "The email or password is incorrect."
            : error.message || "Unable to sign in."
        );
        return;
      }

      const { data: isOwner } = await supabase.schema("research").rpc("am_i_owner");
      window.location.replace(isOwner === true ? "/admin" : "/dashboard");
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
      setMessage(error.message || "Unable to create your account.");
      return;
    }

    if (data.session) {
      window.location.replace("/dashboard");
      return;
    }

    setStatus("sent");
    setMessage(
      "Your account was created. Check your email to confirm it once, then you can sign in with your email and password."
    );
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
              Explore research, formulation, self-technologies, classes, and the broader
              Haus of Sunflowers learning environment.
            </p>
          </div>

          <div className="sidebar-note" style={{ borderTopColor: "rgba(184,148,69,.28)" }}>
            <p>Black histories.<br />Rooted everywhere.</p>
            <span>Preserve · Research · Reconnect</span>
          </div>
        </div>

        <div className="login-card">
          <div className="eyebrow">{mode === "signin" ? "Secure access" : "Create an account"}</div>
          <h1>{mode === "signin" ? "Welcome back" : "Join Haus of Sunflowers"}</h1>
          <p>
            {mode === "signin"
              ? "Sign in with your email and password. Successful sign-in takes you directly into the app."
              : "Create a regular member account with your email and password. Student access is handled separately through the Student Access page."}
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

            <label className="field-label" htmlFor="password" style={{ marginTop: 16 }}>
              Password
            </label>
            <div className="password-field-wrap">
              <input
                id="password"
                className="field password-field"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button className="primary-button" type="submit" disabled={status === "loading"}>
              {status === "loading"
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {status !== "idle" && status !== "loading" && (
            <p className={status === "error" ? "status-message error" : "status-message"}>
              {message}
            </p>
          )}

          {mode === "signin" && (
            <p style={{ marginTop: 18 }}>
              <Link href="/forgot-password">Forgot or need to set your password?</Link>
            </p>
          )}

          <p style={{ marginTop: 18 }}>
            Student? <Link href="/student-access">Use Student Access.</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
