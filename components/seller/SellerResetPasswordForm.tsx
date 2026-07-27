"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SellerResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase env is not configured.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/seller");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Follow the link from your email to get here, then choose a new password.
      </p>

      <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="new-password">
        New password
      </label>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-base font-bold text-slate-950 outline-none"
        id="new-password"
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        value={password}
      />

      <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="confirm-password">
        Confirm password
      </label>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-3 text-base font-bold text-slate-950 outline-none"
        id="confirm-password"
        onChange={(e) => setConfirmPassword(e.target.value)}
        type="password"
        value={confirmPassword}
      />

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

      <button
        className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
