"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson } from "@/components/admin/admin-form-utils";
import type { GearCategory, GearProduct, GearProductStatus } from "@/types/automobile";

const statusDot: Record<GearProductStatus, string> = {
  draft: "bg-slate-300",
  pending_review: "bg-amber-500",
  live: "bg-emerald-500",
  rejected: "bg-red-500",
  paused: "bg-slate-400",
};

export function GearProductsList({ products, categories }: { products: GearProduct[]; categories: GearCategory[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | GearProductStatus>("pending_review");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    return products
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .filter((p) => (categoryFilter === "all" ? true : p.categoryId === categoryFilter))
      .filter((p) => (search.trim() ? p.title.toLowerCase().includes(search.trim().toLowerCase()) : true));
  }, [products, statusFilter, categoryFilter, search]);

  function toggleSelected(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function act(id: string, action: "approve" | "reject" | "pause" | "resume", body?: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      await patchAdminJson("/api/admin/gaadigear/products", { action, id, ...body });
      setRejectingId(null);
      setReason("");
      selected.delete(id);
      setSelected(new Set(selected));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update product");
    } finally {
      setBusyId(null);
    }
  }

  async function bulkApprove() {
    setError("");
    for (const id of selected) {
      try {
        await patchAdminJson("/api/admin/gaadigear/products", { action: "approve", id });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to update one or more products");
      }
    }
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-black text-slate-950">GaadiGear products</h1>

      <div className="flex flex-wrap gap-2">
        <input className={`${adminFieldClass} w-56`} onChange={(e) => setSearch(e.target.value)} placeholder="Search title" value={search} />
        <select className={adminFieldClass} onChange={(e) => setCategoryFilter(e.target.value)} value={categoryFilter}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.level === 2 ? "— " : ""}
              {c.name}
            </option>
          ))}
        </select>
        <select className={adminFieldClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
          <option value="all">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="live">Live</option>
          <option value="rejected">Rejected</option>
          <option value="paused">Paused</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="font-bold text-emerald-800">{selected.size} selected</span>
          <button className="font-bold text-emerald-700 hover:underline" onClick={bulkApprove} type="button">
            Approve
          </button>
          <button className="font-bold text-slate-500 hover:underline" onClick={() => setSelected(new Set())} type="button">
            Clear
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No products match this filter.</p>
      ) : (
        <div>
          {rows.map((p) => (
            <div className="border-b border-slate-200 py-2 text-sm" key={p.id}>
              <div className="flex items-center gap-3">
                <input checked={selected.has(p.id)} onChange={() => toggleSelected(p.id)} type="checkbox" />
                <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/admin/gaadigear/products/${p.id}`}>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={p.title} className="h-full w-full object-cover" src={p.images[0]} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-slate-950 hover:underline">{p.title}</div>
                    <div className="truncate text-xs text-slate-500">{p.sellerName ?? "—"}</div>
                  </div>
                </Link>
                <div className="w-32 truncate text-xs text-slate-500">{p.categoryName ?? "—"}</div>
                <div className="w-20 text-xs text-slate-600">₹{p.sellingPrice}</div>
                <div className="w-16 text-xs text-slate-500">{p.stockQty} qty</div>
                <div className="flex w-32 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[p.status]}`} />
                  <span className="text-xs text-slate-600">{p.status.replace("_", " ")}</span>
                </div>
                <div className="flex w-44 shrink-0 flex-wrap justify-end gap-3">
                  {p.status === "pending_review" && (
                    <button
                      className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, "approve")}
                      type="button"
                    >
                      Approve
                    </button>
                  )}
                  {p.status === "live" && (
                    <button
                      className="text-xs font-bold text-slate-600 hover:underline disabled:opacity-50"
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, "pause")}
                      type="button"
                    >
                      Pause
                    </button>
                  )}
                  {p.status === "paused" && (
                    <button
                      className="text-xs font-bold text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, "resume")}
                      type="button"
                    >
                      Resume
                    </button>
                  )}
                  {p.status !== "rejected" && (
                    <button
                      className="text-xs font-bold text-red-600 hover:underline"
                      onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                      type="button"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {rejectingId === p.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-16">
                  <input
                    className={`${adminFieldClass} w-72`}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Rejection reason"
                    value={reason}
                  />
                  <button
                    className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    disabled={busyId === p.id || reason.trim().length < 3}
                    onClick={() => act(p.id, "reject", { reason })}
                    type="button"
                  >
                    Confirm reject
                  </button>
                  <button className="text-xs font-bold text-slate-500 hover:underline" onClick={() => setRejectingId(null)} type="button">
                    Cancel
                  </button>
                </div>
              )}

              {p.rejectionReason && p.status === "rejected" && <p className="mt-1 pl-16 text-xs text-red-600">Rejected: {p.rejectionReason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
