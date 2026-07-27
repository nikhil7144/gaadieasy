"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function BuyerForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase env is not configured.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/gaadigear/account/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Check your email</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          If an account exists for {email}, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">Reset your password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">We&apos;ll email you a link to set a new password.</p>

      <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="buyer-forgot-email">
        Email
      </label>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-base font-bold text-slate-950 outline-none"
        id="buyer-forgot-email"
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        value={email}
      />

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

      <button
        className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
        disabled={loading || !email}
        type="submit"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-500">
        <a className="font-bold text-emerald-700 hover:underline" href="/gaadigear/account/login">
          Back to sign in
        </a>
      </p>
    </form>
  );
}
