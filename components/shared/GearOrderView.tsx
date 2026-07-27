"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { GearOrderSummary } from "@/types/automobile";

async function sendJson(url: string, method: "POST", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function GearOrderView({ order }: { order: GearOrderSummary }) {
  const [error, setError] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [reasonCategory, setReasonCategory] = useState("changed_mind");
  const [reasonNote, setReasonNote] = useState("");
  const [submittedRefundFor, setSubmittedRefundFor] = useState<Set<string>>(new Set());

  async function submitRefundRequest(shipmentId: string) {
    setError("");
    try {
      await sendJson(`/api/gear-orders/${shipmentId}/refund-request`, "POST", { reasonCategory, reasonNote, items: [] });
      setSubmittedRefundFor(new Set([...submittedRefundFor, shipmentId]));
      setRefundingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit refund request");
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-lg font-black text-slate-950">Order confirmation</h1>
      <p className="text-sm text-slate-500">Order #{order.id}</p>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      {order.paymentStatus === "paid" ? (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={22} />
          <div>
            <p className="text-sm font-black text-emerald-800">Order placed successfully</p>
            <p className="text-xs font-bold text-emerald-700">We&apos;ll notify you as each seller ships your items.</p>
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">Payment {order.paymentStatus}</p>
      )}

      {order.shipments.map((shipment) => (
        <section className="rounded-md border border-slate-200 bg-white p-4" key={shipment.id}>
          <p className="mb-2 text-xs font-black uppercase text-emerald-700">Sold by {shipment.sellerName ?? "Seller"}</p>
          {shipment.items.map((item) => (
            <div className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-b-0" key={item.id}>
              <span>
                {item.title} × {item.qty}
              </span>
              <span className="font-bold text-slate-950">₹{item.lineTotal}</span>
            </div>
          ))}
          <p className="mt-2 text-right text-xs text-slate-500">
            Shipping: ₹{shipment.shippingFee} · Status: {shipment.shipmentStatus}
          </p>

          {shipment.shipmentStatus === "delivered" &&
            (submittedRefundFor.has(shipment.id) ? (
              <p className="mt-2 text-xs font-bold text-emerald-700">Refund request submitted.</p>
            ) : refundingId === shipment.id ? (
              <div className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                <select
                  className="min-h-9 w-full rounded-md border border-slate-200 px-2 text-xs font-bold text-slate-950"
                  onChange={(e) => setReasonCategory(e.target.value)}
                  value={reasonCategory}
                >
                  <option value="defective">Defective</option>
                  <option value="wrong_item">Wrong item</option>
                  <option value="damaged">Damaged in transit</option>
                  <option value="not_as_described">Not as described</option>
                  <option value="changed_mind">Changed my mind</option>
                </select>
                <textarea
                  className="min-h-16 w-full rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-950"
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder="Details (optional)"
                  value={reasonNote}
                />
                <div className="flex gap-3">
                  <button className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => submitRefundRequest(shipment.id)} type="button">
                    Submit request
                  </button>
                  <button className="text-xs font-bold text-slate-500 hover:underline" onClick={() => setRefundingId(null)} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="mt-2 text-xs font-bold text-red-600 hover:underline" onClick={() => setRefundingId(shipment.id)} type="button">
                Request a refund
              </button>
            ))}
        </section>
      ))}

      <div className="rounded-md border border-slate-200 bg-white p-4 text-right">
        <p className="text-sm text-slate-600">Items: ₹{order.itemsSubtotal}</p>
        <p className="text-sm text-slate-600">Shipping: ₹{order.shippingTotal}</p>
        <p className="text-lg font-black text-slate-950">Total: ₹{order.grandTotal}</p>
      </div>
    </main>
  );
}
