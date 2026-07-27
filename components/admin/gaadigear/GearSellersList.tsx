"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson } from "@/components/admin/admin-form-utils";
import type { Seller, SellerStatus } from "@/types/automobile";

const statusDot: Record<SellerStatus, string> = {
  onboarding: "bg-amber-500",
  active: "bg-emerald-500",
  suspended: "bg-red-500",
};

export function GearSellersList({ sellers }: { sellers: Seller[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SellerStatus>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    return sellers
      .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
      .filter((s) =>
        search.trim()
          ? s.businessName.toLowerCase().includes(search.trim().toLowerCase()) ||
            (s.contactEmail ?? "").toLowerCase().includes(search.trim().toLowerCase())
          : true,
      );
  }, [sellers, statusFilter, search]);

  async function act(id: string, action: "approve" | "reject" | "suspend", body?: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      await patchAdminJson("/api/admin/gaadigear/sellers", { action, id, ...body });
      setRejectingId(null);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update seller");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-slate-950">GaadiGear sellers</h1>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${adminFieldClass} w-64`}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search business or email"
          value={search}
        />
        <select className={adminFieldClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
          <option value="all">All statuses</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      {rows.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No sellers match this filter.</p>
      ) : (
        <div>
          {rows.map((s) => (
            <div className="border-b border-slate-200 py-2 text-sm" key={s.id}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-950">{s.businessName}</div>
                  <div className="truncate text-xs text-slate-500">{s.contactEmail ?? "—"} · {s.gstin ?? "no GSTIN"}</div>
                </div>
                <div className="w-20 text-xs text-slate-500">{s.commissionPct}%</div>
                <div className="flex w-28 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[s.status]}`} />
                  <span className="text-xs text-slate-600">{s.status}</span>
                </div>
                <div className="w-32 text-xs text-slate-500">kyc: {s.kycStatus}</div>
                <div className="flex w-40 shrink-0 justify-end gap-3">
                  {s.status !== "active" && (
                    <button
                      className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={busyId === s.id}
                      onClick={() => act(s.id, "approve")}
                      type="button"
                    >
                      Approve
                    </button>
                  )}
                  {s.kycStatus !== "rejected" && (
                    <button
                      className="text-xs font-bold text-red-600 hover:underline"
                      onClick={() => setRejectingId(rejectingId === s.id ? null : s.id)}
                      type="button"
                    >
                      Reject
                    </button>
                  )}
                  {s.status === "active" && (
                    <button
                      className="text-xs font-bold text-slate-500 hover:underline disabled:opacity-50"
                      disabled={busyId === s.id}
                      onClick={() => act(s.id, "suspend")}
                      type="button"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>

              {rejectingId === s.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-1">
                  <input
                    className={`${adminFieldClass} w-72`}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Rejection reason"
                    value={reason}
                  />
                  <button
                    className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    disabled={busyId === s.id || reason.trim().length < 3}
                    onClick={() => act(s.id, "reject", { reason })}
                    type="button"
                  >
                    Confirm reject
                  </button>
                  <button className="text-xs font-bold text-slate-500 hover:underline" onClick={() => setRejectingId(null)} type="button">
                    Cancel
                  </button>
                </div>
              )}

              {s.kycRejectionReason && s.kycStatus === "rejected" && (
                <p className="mt-1 pl-1 text-xs text-red-600">Rejected: {s.kycRejectionReason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
