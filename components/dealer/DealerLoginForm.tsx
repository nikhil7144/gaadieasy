"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function DealerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dealer");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-black uppercase text-emerald-800">
        Dealer access
      </div>
      <h1 className="mt-4 text-3xl font-black text-slate-950">Sign in to dealer desk</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Business owners can see all showroom leads. Showroom users see only their assigned outlet.
      </p>

      <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="dealer-email">
        Email
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Mail size={18} className="text-emerald-700" />
        <input
          id="dealer-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none"
          required
        />
      </div>

      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="dealer-password">
        Password
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <LockKeyhole size={18} className="text-emerald-700" />
        <input
          id="dealer-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-12 w-full bg-transparent text-base font-bold text-slate-950 outline-none"
          required
        />
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
