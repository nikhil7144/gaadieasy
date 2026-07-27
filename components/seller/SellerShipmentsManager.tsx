"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/seller/FormField";
import { fieldClass, ghostButtonClass, microLabelClass, primaryButtonClass } from "@/components/seller/dashboardStyles";
import { ShipmentStatusBadge } from "@/components/seller/StatusBadge";
import type { SellerShipment } from "@/lib/services/gear-fulfillment";

async function sendJson(url: string, body: unknown) {
  const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function SellerShipmentsManager({ shipments }: { shipments: SellerShipment[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [courier, setCourier] = useState<Record<string, string>>({});
  const [tracking, setTracking] = useState<Record<string, string>>({});

  async function ship(shipmentId: string) {
    setBusyId(shipmentId);
    setError("");
    try {
      await sendJson("/api/seller/shipments", { action: "ship", shipmentId, courierName: courier[shipmentId] ?? "", trackingNumber: tracking[shipmentId] ?? "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to mark shipped");
    } finally {
      setBusyId(null);
    }
  }

  async function deliver(shipmentId: string) {
    setBusyId(shipmentId);
    setError("");
    try {
      await sendJson("/api/seller/shipments", { action: "deliver", shipmentId });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to mark delivered");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-[#171717]">Orders</h1>

      {error && <p className="text-sm font-bold text-[#ef4444]">{error}</p>}

      {shipments.length === 0 ? (
        <p className="py-6 text-sm text-[#6b7280]">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.08]">
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Order</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Subtotal</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Status</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.08]">
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td className="max-w-xs px-4 py-3 font-bold text-[#171717]">{s.items.map((i) => `${i.title} × ${i.qty}`).join(", ")}</td>
                  <td className="px-4 py-3 font-bold text-[#171717]">₹{s.itemsSubtotal}</td>
                  <td className="px-4 py-3">
                    <ShipmentStatusBadge status={s.shipmentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {(s.shipmentStatus === "placed" || s.shipmentStatus === "packed") && (
                      <div className="flex flex-wrap items-end gap-2">
                        <FormField label="Courier name">
                          <input className={fieldClass} onChange={(e) => setCourier({ ...courier, [s.id]: e.target.value })} value={courier[s.id] ?? ""} />
                        </FormField>
                        <FormField label="Tracking number">
                          <input className={fieldClass} onChange={(e) => setTracking({ ...tracking, [s.id]: e.target.value })} value={tracking[s.id] ?? ""} />
                        </FormField>
                        <button
                          className={primaryButtonClass}
                          disabled={busyId === s.id || !courier[s.id] || !tracking[s.id]}
                          onClick={() => ship(s.id)}
                          type="button"
                        >
                          Mark shipped
                        </button>
                      </div>
                    )}

                    {s.shipmentStatus === "shipped" && (
                      <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                        <span>
                          {s.courierName} · {s.trackingNumber}
                        </span>
                        <button className={ghostButtonClass} disabled={busyId === s.id} onClick={() => deliver(s.id)} type="button">
                          Mark delivered
                        </button>
                      </div>
                    )}

                    {s.shipmentStatus === "delivered" && (
                      <p className="text-xs text-[#6b7280]">
                        Delivered {s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : ""} · payout {s.payoutStatus}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
