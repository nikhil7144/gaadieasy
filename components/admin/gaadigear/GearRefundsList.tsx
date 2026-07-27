"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass } from "@/components/admin/admin-form-utils";
import type { RefundRequest } from "@/lib/services/gear-refunds";

const statusDot: Record<string, string> = {
  requested: "bg-amber-500",
  approved: "bg-amber-500",
  rejected: "bg-slate-400",
  refunded: "bg-emerald-500",
};

async function sendJson(url: string, body: unknown) {
  const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function GearRefundsList({ refundRequests }: { refundRequests: RefundRequest[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "requested" | "rejected" | "refunded">("requested");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const rows = useMemo(
    () => refundRequests.filter((r) => (statusFilter === "all" ? true : r.status === statusFilter)),
    [refundRequests, statusFilter],
  );

  async function approve(id: string) {
    setBusyId(id);
    setError("");
    try {
      await sendJson("/api/admin/gaadigear/refund-requests", { action: "approve", id, refundAmount: Number(amounts[id] ?? 0) });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to approve refund");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError("");
    try {
      await sendJson("/api/admin/gaadigear/refund-requests", { action: "reject", id, adminNotes: notes[id] ?? "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reject refund");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-slate-950">GaadiGear refund requests</h1>

      <select className={adminFieldClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
        <option value="requested">Pending</option>
        <option value="all">All</option>
        <option value="rejected">Rejected</option>
        <option value="refunded">Refunded</option>
      </select>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No refund requests match this filter.</p>
      ) : (
        <div>
          {rows.map((r) => (
            <div className="border-b border-slate-200 py-2 text-sm" key={r.id}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-950">{r.reasonCategory.replace("_", " ")}</div>
                  {r.reasonNote && <div className="truncate text-xs text-slate-500">{r.reasonNote}</div>}
                </div>
                <div className="flex w-28 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[r.status] ?? "bg-slate-300"}`} />
                  <span className="text-xs text-slate-600">{r.status}</span>
                </div>
                {r.status === "requested" && (
                  <>
                    <input
                      className={`${adminFieldClass} w-28`}
                      onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })}
                      placeholder="Refund ₹"
                      type="number"
                      value={amounts[r.id] ?? ""}
                    />
                    <button
                      className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={busyId === r.id || !amounts[r.id]}
                      onClick={() => approve(r.id)}
                      type="button"
                    >
                      Approve
                    </button>
                    <input
                      className={`${adminFieldClass} w-32`}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                      placeholder="Reject reason"
                      value={notes[r.id] ?? ""}
                    />
                    <button
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                      disabled={busyId === r.id || !notes[r.id]}
                      onClick={() => reject(r.id)}
                      type="button"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
