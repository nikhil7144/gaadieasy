"use client";

import { useState } from "react";
import type { PayoutPreviewRow } from "@/lib/services/gear-payouts";

async function sendJson(url: string, method: "GET" | "POST") {
  const response = await fetch(url, { method });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function GearPayoutsRun({ preview: initialPreview }: { preview: PayoutPreviewRow[] }) {
  const [preview, setPreview] = useState(initialPreview);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ payoutsCreated: number; shipmentsPaid: number } | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const payload = await sendJson("/api/admin/gaadigear/payouts/run", "POST");
      setResult(payload);
      const refreshed = await sendJson("/api/admin/gaadigear/payouts/preview", "GET");
      setPreview(refreshed.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to run payout batch");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-slate-950">GaadiGear payouts</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">
          Manual-trigger weekly payout run — no cron infra exists yet, mirrors the pricing-cache/catalog-rebuild
          pattern. Pays every shipment that&apos;s delivered, past the 3-day return window, and has no unresolved
          refund request.
        </p>
        <button
          className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          disabled={running}
          onClick={run}
          type="button"
        >
          {running ? "Running…" : "Run payout batch now"}
        </button>
        {result && (
          <p className="mt-2 text-sm font-bold text-emerald-700">
            Done — {result.payoutsCreated} payouts created, {result.shipmentsPaid} shipments paid
          </p>
        )}
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
      </div>

      {preview.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">Nothing eligible for payout right now.</p>
      ) : (
        <div>
          {preview.map((row) => (
            <div className="flex items-center justify-between border-b border-slate-200 py-2 text-sm" key={row.sellerId}>
              <span className="font-bold text-slate-950">{row.sellerName ?? row.sellerId}</span>
              <span className="text-xs text-slate-500">{row.shipmentCount} shipment(s)</span>
              <span className="font-bold text-emerald-700">₹{row.netPayout.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
