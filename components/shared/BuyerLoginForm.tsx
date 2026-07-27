"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function BuyerLoginForm({ redirectTo = "/gaadigear/cart" }: { redirectTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

    const { error: authError } =
      mode === "signup" ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fold any guest cart built up before this login into the account.
    await fetch("/api/gear-cart/merge", { method: "POST" }).catch(() => {});

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">{mode === "signup" ? "Create your account" : "Sign in"}</h1>
      <p className="mt-2 text-sm text-slate-500">
        An account is optional — you can check out as a guest instead. Signing in just keeps your cart and order
        history with you.
      </p>

      <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="buyer-email">
        Email
      </label>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-base font-bold text-slate-950 outline-none"
        id="buyer-email"
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        value={email}
      />

      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="buyer-password">
        Password
      </label>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-base font-bold text-slate-950 outline-none"
        id="buyer-password"
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        value={password}
      />
      {mode === "signin" && (
        <p className="mt-2 text-right text-xs">
          <a className="font-bold text-emerald-700 hover:underline" href="/gaadigear/account/forgot-password">
            Forgot password?
          </a>
        </p>
      )}

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

      <button
        className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <button
        className="mt-4 w-full text-center text-sm font-bold text-emerald-700 hover:underline"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        type="button"
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}
