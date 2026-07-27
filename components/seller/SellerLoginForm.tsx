"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/seller");
    router.refresh();
  }

  // Requires the Google provider to be enabled in the Supabase dashboard
  // (Authentication > Providers > Google, with a Google Cloud OAuth client
  // id/secret) -- not something that can be configured from application code.
  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase env is not configured.");
      setGoogleLoading(false);
      return;
    }

    // Routes through /gaadigear/sell/auth/complete rather than straight to
    // /seller -- handles both an existing Google-linked seller (redirects
    // straight through) and someone signing in with Google for the first
    // time without ever going through the signup wizard (prompts for a
    // business name before creating the seller record).
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/gaadigear/sell/auth/complete` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-2xl font-black text-slate-950">Log in to your account</h1>
      <p className="mt-1.5 text-sm leading-6 text-slate-500">Manage your products, orders and payouts.</p>
      {justVerified && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">Email verified — you can log in now.</p>}

      <button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
        type="button"
      >
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <label className="block text-sm font-bold text-slate-700" htmlFor="seller-email">
        Email
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Mail size={18} className="text-emerald-700" />
        <input
          id="seller-email"
          type="email"
          autoComplete="email"
          placeholder="rahul@revxgear.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none"
          required
        />
      </div>

      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="seller-password">
        Password
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <LockKeyhole size={18} className="text-emerald-700" />
        <input
          id="seller-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none"
          required
        />
      </div>
      <p className="mt-2 text-right text-xs">
        <a className="font-bold text-emerald-700 hover:underline" href="/gaadigear/sell/forgot-password">
          Forgot password?
        </a>
      </p>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
