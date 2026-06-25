"use client";

import { useState } from "react";

export function PricingCacheBackfill() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ computed?: number; variants?: number; cities?: number } | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function run() {
    setState("running");
    setResult(null);
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/pricing-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      setResult(json);
      setState("done");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-xl font-black text-slate-950">Pricing cache</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pre-computes on-road prices for all active variants × cities and stores them in the database.
        Run this after adding new cities or bulk-importing variants.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={run}
          disabled={state === "running"}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          type="button"
        >
          {state === "running" ? "Computing…" : "Backfill now"}
        </button>
        {state === "done" && result && (
          <span className="text-sm font-bold text-emerald-700">
            Done — {result.computed?.toLocaleString()} rows ({result.variants} variants × {result.cities} cities)
          </span>
        )}
        {state === "error" && (
          <span className="text-sm font-bold text-red-600">{errMsg}</span>
        )}
      </div>
    </div>
  );
}
