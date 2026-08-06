"use client";

import { useEffect, useRef, useState } from "react";
import { FormField } from "@/components/seller/FormField";
import { fieldClass } from "@/components/seller/dashboardStyles";
import { describeApiError } from "@/lib/utils/api-error";
import type { GearProductVariant } from "@/types/automobile";

async function sendJson(url: string, method: "GET" | "POST", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(describeApiError(payload, `HTTP ${response.status}`));
  return payload;
}

export function SellerProductVariantsEditor({ productId, onCountChange }: { productId: string; onCountChange?: (count: number) => void }) {
  const [variants, setVariants] = useState<GearProductVariant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  async function uploadSlotImage(slot: number, file: File) {
    setUploadingSlot(slot);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/seller/upload-image", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setImages((prev) => {
        const next = [...prev];
        next[slot] = payload.url;
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploadingSlot(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    sendJson(`/api/seller/products/variants?productId=${productId}`, "GET")
      .then((payload) => {
        if (!cancelled) {
          setVariants(payload.variants);
          onCountChange?.(payload.variants.length);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load variants");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, onCountChange]);

  function resetForm() {
    setSize("");
    setColor("");
    setMrp("");
    setSellingPrice("");
    setStockQty("0");
    setImages([]);
  }

  function startEdit(v: GearProductVariant) {
    setError("");
    setEditingId(v.id);
    setSize(v.size ?? "");
    setColor(v.color ?? "");
    setMrp(String(v.mrp));
    setSellingPrice(String(v.sellingPrice));
    setStockQty(String(v.stockQty));
    setImages(v.images ?? []);
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
    resetForm();
  }

  function clearImage(slot: number) {
    setImages((prev) => {
      const next = [...prev];
      next[slot] = "";
      return next;
    });
  }

  async function submitForm() {
    setError("");
    if (!(Number(mrp) > 0) || !(Number(sellingPrice) > 0)) {
      setError("MRP and selling price are required for a variant.");
      return;
    }
    // Variant photos are optional -- 0 falls back to the product's own
    // gallery -- but if any are set there must be exactly 2, and different.
    const filled = images.filter(Boolean);
    if (filled.length !== 0 && filled.length !== 2) {
      setError("Add exactly 2 photos for this variant, or none at all.");
      return;
    }
    if (filled.length === 2 && filled[0] === filled[1]) {
      setError("Upload two different photos for this variant — the same photo twice isn't allowed.");
      return;
    }
    try {
      if (editingId) {
        const payload = await sendJson("/api/seller/products/variants", "POST", {
          action: "update",
          variantId: editingId,
          size: size || undefined,
          color: color || undefined,
          mrp: Number(mrp),
          sellingPrice: Number(sellingPrice),
          stockQty: Number(stockQty) || 0,
          images: filled,
        });
        setVariants((prev) => prev.map((v) => (v.id === editingId ? payload.variant : v)));
        cancelEdit();
      } else {
        const payload = await sendJson("/api/seller/products/variants", "POST", {
          action: "create",
          productId,
          size: size || undefined,
          color: color || undefined,
          mrp: Number(mrp),
          sellingPrice: Number(sellingPrice),
          stockQty: Number(stockQty) || 0,
          images: filled,
        });
        const next = [...variants, payload.variant];
        setVariants(next);
        onCountChange?.(next.length);
        resetForm();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save variant");
    }
  }

  async function removeVariant(variantId: string) {
    setError("");
    try {
      await sendJson("/api/seller/products/variants", "POST", { action: "delete", variantId });
      const next = variants.filter((v) => v.id !== variantId);
      setVariants(next);
      onCountChange?.(next.length);
      if (editingId === variantId) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove variant");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#6b7280]">Leave empty if this product is a single SKU with no size/color options.</p>

      {error && <p className="text-xs font-bold text-[#ef4444]">{error}</p>}

      {loaded && variants.length > 0 && (
        <div className="divide-y divide-black/[0.08] rounded-md border border-black/[0.08]">
          {variants.map((v) => (
            <div className={`flex items-center justify-between px-3 py-2 text-xs ${editingId === v.id ? "bg-[#3ecf8e]/10" : ""}`} key={v.id}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {v.images.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Variant" className="h-8 w-8 rounded border border-black/[0.08] object-cover" key={url} src={url} />
                  ))}
                </div>
                <span className="font-bold text-[#171717]">
                  {[v.size, v.color].filter(Boolean).join(" / ") || "Default"} — MRP ₹{v.mrp} · Price ₹{v.sellingPrice} · stock {v.stockQty}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button className="font-bold text-[#0f8a5f] hover:underline" onClick={() => startEdit(v)} type="button">
                  Edit
                </button>
                <button className="font-bold text-[#ef4444] hover:underline" onClick={() => removeVariant(v.id)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-bold text-[#6b7280]">Variant images (optional — 2 if you add any, else falls back to the product&apos;s own photos)</p>
      <div className="flex flex-wrap items-center gap-2">
        {[0, 1].map((slot) => (
          <div className="relative" key={slot}>
            <button
              className="block h-16 w-16 overflow-hidden rounded-md border-2 border-dashed border-black/20 transition hover:border-[#3ecf8e] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={uploadingSlot === slot}
              onClick={() => fileInputRefs[slot].current?.click()}
              type="button"
            >
              {images[slot] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={`Variant image ${slot + 1}`} className="h-full w-full object-cover" src={images[slot]} />
              ) : (
                <span className="grid h-full w-full place-items-center text-[10px] font-bold text-[#6b7280]">+ Img {slot + 1}</span>
              )}
            </button>
            {images[slot] && (
              <button
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#ef4444] text-xs font-black text-white"
                onClick={() => clearImage(slot)}
                type="button"
              >
                ×
              </button>
            )}
            <input
              accept="image/*"
              className="hidden"
              disabled={uploadingSlot === slot}
              onChange={(e) => e.target.files?.[0] && uploadSlotImage(slot, e.target.files[0])}
              ref={fileInputRefs[slot]}
              type="file"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <FormField label="Size">
          <input className={fieldClass} onChange={(e) => setSize(e.target.value)} placeholder="e.g. M, L, XL" value={size} />
        </FormField>
        <FormField label="Color">
          <input className={fieldClass} onChange={(e) => setColor(e.target.value)} value={color} />
        </FormField>
        <FormField label="MRP (₹)">
          <input className={`${fieldClass} w-24`} onChange={(e) => setMrp(e.target.value)} type="number" value={mrp} />
        </FormField>
        <FormField label="Selling price (₹)">
          <input className={`${fieldClass} w-24`} onChange={(e) => setSellingPrice(e.target.value)} type="number" value={sellingPrice} />
        </FormField>
        <FormField label="Stock">
          <input className={`${fieldClass} w-20`} onChange={(e) => setStockQty(e.target.value)} type="number" value={stockQty} />
        </FormField>
        <button className="mb-2 text-xs font-bold text-[#0f8a5f] hover:underline" onClick={submitForm} type="button">
          {editingId ? "Save changes" : "+ Add variant"}
        </button>
        {editingId && (
          <button className="mb-2 text-xs font-bold text-[#6b7280] hover:underline" onClick={cancelEdit} type="button">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
