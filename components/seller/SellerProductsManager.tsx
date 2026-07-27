"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { microLabelClass, primaryButtonClass } from "@/components/seller/dashboardStyles";
import { ProductStatusBadge } from "@/components/seller/StatusBadge";
import type { GearProduct } from "@/types/automobile";

async function sendJson(url: string, method: "PATCH" | "DELETE", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function SellerProductsManager({ products }: { products: GearProduct[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: "publish" | "pause" | "resume") {
    setBusyId(id);
    setError("");
    try {
      await sendJson("/api/seller/products", "PATCH", { action, id });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update product");
    } finally {
      setBusyId(null);
    }
  }

  async function removeDraft(id: string) {
    if (!confirm("Delete this draft product?")) return;
    try {
      await sendJson("/api/seller/products", "DELETE", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete product");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-black text-[#171717]">Products</h1>
        <button className={primaryButtonClass} onClick={() => router.push("/seller/products/new")} type="button">
          + Add product
        </button>
      </div>

      {error && <p className="text-sm font-bold text-[#ef4444]">{error}</p>}

      {products.length === 0 ? (
        <p className="py-6 text-sm text-[#6b7280]">You haven&apos;t added any products yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.08]">
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Product</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Category</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Price</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Status</th>
                <th className={`px-4 py-2.5 ${microLabelClass}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.08]">
              {products.map((p) => (
                <tr className="transition hover:bg-[#f4f5f7]" key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-black/[0.08] bg-[#f8f9fa]">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={p.title} className="h-full w-full object-cover" src={p.images[0]} />
                        ) : (
                          <span className="font-mono text-[10px] text-[#6b7280]">—</span>
                        )}
                      </div>
                      <span className="truncate font-bold text-[#171717]">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6b7280]">{p.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 font-bold text-[#171717]">₹{p.sellingPrice}</td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={p.status} />
                    {p.rejectionReason && p.status === "rejected" && <p className="mt-1 max-w-xs text-xs text-[#ef4444]">{p.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="text-xs font-bold text-[#0f8a5f] hover:underline" onClick={() => router.push(`/seller/products/${p.id}`)} type="button">
                        Edit
                      </button>
                      {(p.status === "draft" || p.status === "rejected" || p.status === "pending_review") && (
                        <button
                          className="text-xs font-bold text-[#0f8a5f] hover:underline disabled:opacity-50"
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "publish")}
                          type="button"
                        >
                          Publish
                        </button>
                      )}
                      {p.status === "live" && (
                        <button
                          className="text-xs font-bold text-[#6b7280] hover:underline disabled:opacity-50"
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "pause")}
                          type="button"
                        >
                          Pause
                        </button>
                      )}
                      {p.status === "paused" && (
                        <button
                          className="text-xs font-bold text-[#0f8a5f] hover:underline disabled:opacity-50"
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "resume")}
                          type="button"
                        >
                          Resume
                        </button>
                      )}
                      {p.status === "draft" && (
                        <button className="text-xs font-bold text-[#ef4444] hover:underline" onClick={() => removeDraft(p.id)} type="button">
                          Delete
                        </button>
                      )}
                    </div>
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
