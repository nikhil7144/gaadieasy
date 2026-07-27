"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminFieldClass, patchAdminJson } from "@/components/admin/admin-form-utils";
import type { Brand, GearProduct, GearProductVariant, VehicleModel, VehicleType, VehicleVariant } from "@/types/automobile";

const statusDot: Record<GearProduct["status"], string> = {
  draft: "bg-slate-300",
  pending_review: "bg-amber-500",
  live: "bg-emerald-500",
  rejected: "bg-red-500",
  paused: "bg-slate-400",
};

export function GearProductDetailView({
  product,
  variants,
  vehicleTypes,
  brands,
  models,
  vehicleVariants,
}: {
  product: GearProduct;
  variants: GearProductVariant[];
  vehicleTypes: VehicleType[];
  brands: Brand[];
  models: VehicleModel[];
  vehicleVariants: VehicleVariant[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const vehicleTypeById = useMemo(() => new Map(vehicleTypes.map((vt) => [vt.id, vt.name])), [vehicleTypes]);
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m.name])), [models]);
  const variantById = useMemo(() => new Map(vehicleVariants.map((v) => [v.id, v.name])), [vehicleVariants]);

  function describeCompatibility(row: NonNullable<GearProduct["compatibility"]>[number]): string {
    switch (row.compatibilityType) {
      case "global":
        return "Universal — fits every vehicle type";
      case "vehicle_type":
        return `All of ${vehicleTypeById.get(row.vehicleTypeId ?? "") ?? "an unknown vehicle type"}`;
      case "segment":
        return `${vehicleTypeById.get(row.vehicleTypeId ?? "") ?? "Vehicle type"} — segment "${row.segment}"`;
      case "brand":
        return `All models of ${brandById.get(row.vehicleBrandId ?? "") ?? "an unknown brand"}`;
      case "model":
        return `All variants of ${modelById.get(row.vehicleModelId ?? "") ?? "an unknown model"}`;
      case "variant":
        return `${modelById.get(row.vehicleModelId ?? "") ?? "Model"} — ${variantById.get(row.vehicleVariantId ?? "") ?? "an unknown variant"}`;
      default:
        return row.compatibilityType;
    }
  }

  async function approve() {
    setBusy(true);
    setError("");
    try {
      await patchAdminJson("/api/admin/gaadigear/products", { action: "approve", id: product.id });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to approve product");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    setError("");
    try {
      await patchAdminJson("/api/admin/gaadigear/products", { action: "reject", id: product.id, reason });
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reject product");
    } finally {
      setBusy(false);
    }
  }

  async function setPaused(paused: boolean) {
    setBusy(true);
    setError("");
    try {
      await patchAdminJson("/api/admin/gaadigear/products", { action: paused ? "pause" : "resume", id: product.id });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-950" href="/admin/gaadigear/products">
          <ArrowLeft size={14} /> Products
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-950">{product.title}</span>
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusDot[product.status]}`} />
              <span className="text-xs font-black uppercase text-slate-500">{product.status.replace("_", " ")}</span>
            </div>
            <h1 className="mt-2 text-xl font-black text-slate-950">{product.title}</h1>
            <p className="text-sm text-slate-500">
              {product.categoryName ?? "—"} {product.brandName ? `· ${product.brandName}` : ""} · Sold by {product.sellerName ?? "—"}
            </p>

            {product.images.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.images.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={product.title} className="h-24 w-24 rounded-md border border-slate-200 object-cover" key={url} src={url} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-amber-700">No photos uploaded yet.</p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">{product.hasMultipleVariants ? "MRP (from)" : "MRP"}</p>
                <p className="font-black text-slate-950">₹{product.mrp}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">{product.hasMultipleVariants ? "Selling price (from)" : "Selling price"}</p>
                <p className="font-black text-slate-950">₹{product.sellingPrice}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Total stock</p>
                <p className="font-black text-slate-950">{product.stockQty}</p>
              </div>
            </div>
            {product.hasMultipleVariants && (
              <p className="mt-1 text-xs text-slate-500">This product has multiple variants at different prices — see the breakdown below.</p>
            )}

            {product.description && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-bold uppercase text-slate-400">Description</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{product.description}</p>
              </div>
            )}

            {product.rejectionReason && product.status === "rejected" && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Rejected: {product.rejectionReason}</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-500">What this fits</p>
            {product.compatibility && product.compatibility.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {product.compatibility.map((row) => (
                  <li key={row.id ?? `${row.compatibilityType}-${row.vehicleModelId}-${row.vehicleVariantId}`}>· {describeCompatibility(row)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-amber-700">No compatibility set.</p>
            )}
          </div>

          {variants.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-500">Variants ({variants.length})</p>
              <div className="mt-2 divide-y divide-slate-100">
                {variants.map((v) => (
                  <div className="flex items-center gap-3 py-2 text-sm" key={v.id}>
                    <div className="flex gap-1">
                      {v.images.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="Variant" className="h-10 w-10 rounded border border-slate-200 object-cover" key={url} src={url} />
                      ))}
                    </div>
                    <span className="font-bold text-slate-950">
                      {[v.size, v.color].filter(Boolean).join(" / ") || "Default"} — MRP ₹{v.mrp} · Price ₹{v.sellingPrice} · stock {v.stockQty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-500">Moderation</p>
            <div className="mt-3 flex flex-col gap-2">
              {product.status !== "live" && product.status !== "paused" && (
                <button
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50"
                  disabled={busy}
                  onClick={approve}
                  type="button"
                >
                  Approve → live
                </button>
              )}
              {product.status === "live" && (
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setPaused(true)}
                  type="button"
                >
                  Pause — hide from buyers
                </button>
              )}
              {product.status === "paused" && (
                <button
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setPaused(false)}
                  type="button"
                >
                  Resume → live
                </button>
              )}
              {product.status !== "rejected" && (
                <button
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                  onClick={() => setRejecting((r) => !r)}
                  type="button"
                >
                  Reject
                </button>
              )}
            </div>

            {rejecting && (
              <div className="mt-3 space-y-2">
                <input className={`${adminFieldClass} w-full`} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason" value={reason} />
                <button
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  disabled={busy || reason.trim().length < 3}
                  onClick={reject}
                  type="button"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
