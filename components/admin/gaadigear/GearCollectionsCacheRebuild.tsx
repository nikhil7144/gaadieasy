"use client";

import { useState } from "react";

export function GearCollectionsCacheRebuild() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<{ collections?: number } | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function run() {
    setState("running");
    setResult(null);
    setErrMsg("");
    try {
      const res = await fetch("/api/admin/gaadigear/collections/refresh", { method: "POST", body: "{}" });
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
      <h2 className="text-xl font-black text-slate-950">Collections cache</h2>
      <p className="mt-1 text-sm text-slate-500">
        Rebuilds every collection&apos;s <code className="font-mono">gear_collection_products_cache</code> row. There is no scheduled
        job for this — dynamic collections only update when you save them, click a single collection&apos;s Refresh, or run this.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          disabled={state === "running"}
          onClick={run}
          type="button"
        >
          {state === "running" ? "Rebuilding…" : "Rebuild all now"}
        </button>
        {state === "done" && result && <span className="text-sm font-bold text-emerald-700">Done — {result.collections} collections refreshed</span>}
        {state === "error" && <span className="text-sm font-bold text-red-600">{errMsg}</span>}
      </div>
    </div>
  );
}
