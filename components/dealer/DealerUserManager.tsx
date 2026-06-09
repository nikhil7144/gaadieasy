"use client";

import { useState } from "react";
import type { Dealer } from "@/types/automobile";

type Props = {
  showrooms: Dealer[];
};

export function DealerUserManager({ showrooms }: Props) {
  const [dealerId, setDealerId] = useState(showrooms[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/dealer/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealerId, email, password }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "Unable to create showroom login");
      return;
    }

    setDealerId(showrooms[0]?.id ?? "");
    setEmail("");
    setPassword("");
    setMessage("Showroom login created. The new credentials can sign in at the dealer login page.");
  }

  if (!showrooms.length) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-emerald-700">Showroom access</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Create showroom login</h2>
      <p className="mt-1 text-sm text-slate-500">
        Each showroom can get its own email and password, with access limited to its own leads and offers.
      </p>

      <form className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]" onSubmit={handleSubmit}>
        <select
          className="min-h-11 rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
          value={dealerId}
          onChange={(event) => setDealerId(event.target.value)}
          required
        >
          {showrooms.map((showroom) => (
            <option value={showroom.id} key={showroom.id}>
              {showroom.name}
            </option>
          ))}
        </select>
        <input
          className="min-h-11 rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Unique login email"
          type="email"
          required
        />
        <input
          className="min-h-11 rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          minLength={8}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-3 font-black text-slate-950 hover:bg-lime-400 disabled:bg-slate-300"
        >
          {loading ? "Creating..." : "Create login"}
        </button>
      </form>

      {message ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{message}</p> : null}
    </section>
  );
}
