"use client";

import { useState } from "react";

export function GearCatalogRebuild() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ products?: number; models?: number } | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function run() {
    setState("running");
    setResult(null);
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/gaadigear/catalog-rebuild", { method: "POST" });
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
      <h2 className="text-xl font-black text-slate-950">GaadiGear catalog cache</h2>
      <p className="mt-1 text-sm text-slate-500">
        Rebuilds gear_catalog_index and gear_model_cache from scratch for every product and vehicle model. Run this
        after bulk changes, or if a broad compatibility rule (universal / vehicle-type / segment) doesn&apos;t seem
        to be reflected yet — those are deferred here rather than recomputed on every product save.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          disabled={state === "running"}
          onClick={run}
          type="button"
        >
          {state === "running" ? "Rebuilding…" : "Rebuild now"}
        </button>
        {state === "done" && result && (
          <span className="text-sm font-bold text-emerald-700">
            Done — {result.products} products, {result.models} model cache rows
          </span>
        )}
        {state === "error" && <span className="text-sm font-bold text-red-600">{errMsg}</span>}
      </div>
    </div>
  );
}
