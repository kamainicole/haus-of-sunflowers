"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="container">
      <h1>Haus of Sunflowers Research Archive</h1>
      <p>Sign in with a magic link — no password to manage.</p>
      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send magic link</button>
      </form>
      {status === "sent" && <p>Check your email for a sign-in link.</p>}
      {status === "error" && <p>Something went wrong. Please try again.</p>}
    </main>
  );
}
