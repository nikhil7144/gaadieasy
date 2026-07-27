"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Store, Tag } from "lucide-react";

type Variant = { id: string; size?: string; color?: string; mrp: number; sellingPrice: number; stockQty: number; images: string[] };
type Fitment = { text: string; universal?: boolean };

type Product = {
  id: string;
  sellerId?: string;
  sellerName?: string;
  brandName?: string;
  categoryName?: string;
  title: string;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  fitment: Fitment[];
  variants: Variant[];
};

type DeliveryEstimate = { deliverable: boolean; fee: number; estimatedDays: number; codAvailable: boolean };

export function GearProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "added">("idle");
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [error, setError] = useState("");
  const [pincode, setPincode] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  // A variant swaps the gallery to its own photos (that's the whole point of
  // requiring 2 images per variant -- show the actual color/style picked),
  // falling back to the base product gallery if a variant somehow has none.
  const images = selectedVariant && selectedVariant.images.length > 0 ? selectedVariant.images : product.images;
  // Every product has >= 1 variant, and price/MRP live there exclusively --
  // no product-level price to fall back to.
  const effectivePrice = selectedVariant?.sellingPrice ?? 0;
  const effectiveMrp = selectedVariant?.mrp ?? 0;
  const outOfStock = (selectedVariant?.stockQty ?? 0) <= 0;
  const discountPct = effectiveMrp > effectivePrice ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0;

  const variantLabels = useMemo(
    () => product.variants.map((v) => ({ id: v.id, label: [v.size, v.color].filter(Boolean).join(" / ") || "Default", outOfStock: v.stockQty <= 0 })),
    [product.variants],
  );

  function selectVariant(id: string) {
    setVariantId(id);
    setActiveImage(0);
  }

  async function postCartItem() {
    const response = await fetch("/api/gear-cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, variantId: variantId || undefined, qty }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  }

  async function addToCart() {
    setStatus("loading");
    setError("");
    try {
      await postCartItem();
      setStatus("added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add to cart");
      setStatus("idle");
    }
  }

  async function buyNow() {
    setBuyNowLoading(true);
    setError("");
    try {
      await postCartItem();
      router.push("/gaadigear/checkout");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to proceed to checkout");
      setBuyNowLoading(false);
    }
  }

  async function checkDelivery() {
    if (!product.sellerId || pincode.trim().length !== 6) {
      setEstimateError("Enter a valid 6-digit pincode.");
      return;
    }
    setEstimateLoading(true);
    setEstimateError("");
    setEstimate(null);
    try {
      const response = await fetch(`/api/public/gaadigear/delivery-estimate?sellerId=${product.sellerId}&pincode=${pincode.trim()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setEstimate(payload);
    } catch (e) {
      setEstimateError(e instanceof Error ? e.message : "Unable to check delivery for this pincode");
    } finally {
      setEstimateLoading(false);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:py-14">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {product.ratingAvg > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                  ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                </span>
              )}
              {product.sellerName && (
                <Link
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50 transition hover:bg-white/20"
                  href={product.sellerId ? `/gaadigear/sellers/${product.sellerId}` : "#"}
                >
                  <Store size={14} /> {product.sellerName}
                </Link>
              )}
              {product.brandName && <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50">{product.brandName}</span>}
            </div>

            <h1 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">{product.title}</h1>
            {product.categoryName && <p className="mt-3 text-lg font-bold text-lime-200">{product.categoryName}</p>}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-lime-300 p-4 text-slate-950">
                <div className="text-xs font-bold uppercase text-slate-700">Price</div>
                <div className="mt-1 text-2xl font-black">₹{effectivePrice}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <div className="text-xs font-bold uppercase text-emerald-100">MRP</div>
                <div className="mt-1 text-xl font-black opacity-80 line-through">₹{effectiveMrp}</div>
              </div>
              <div className="rounded-lg border border-amber-200/30 bg-amber-300/15 p-4">
                <div className="text-xs font-bold uppercase text-amber-100">You save</div>
                <div className="mt-1 text-xl font-black">{discountPct > 0 ? `${discountPct}%` : "—"}</div>
              </div>
            </div>

            {product.fitment.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.fitment.slice(0, 6).map((f, i) => (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50" key={`${f.text}-${i}`}>
                    <Tag size={14} /> {f.text}
                  </span>
                ))}
              </div>
            )}

            {product.variants.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {variantLabels.map((v) => (
                  <button
                    className={`rounded-full border-2 px-4 py-2 text-sm font-black transition ${
                      v.outOfStock
                        ? "cursor-not-allowed border-white/10 text-white/30"
                        : variantId === v.id
                          ? "border-lime-300 bg-lime-300 text-slate-950"
                          : "border-white/20 text-white hover:border-lime-300"
                    }`}
                    disabled={v.outOfStock}
                    key={v.id}
                    onClick={() => selectVariant(v.id)}
                    type="button"
                  >
                    {v.label}
                    {v.outOfStock ? " (out of stock)" : ""}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <input
                className="w-16 rounded-lg border border-white/20 bg-white/10 px-2 py-3 text-center text-sm font-black text-white outline-none"
                min={1}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                type="number"
                value={qty}
              />
              {status === "added" ? (
                <Link className="rounded-lg bg-lime-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200" href="/gaadigear/cart">
                  Added — go to cart →
                </Link>
              ) : (
                <>
                  <button
                    className="rounded-lg border-2 border-white px-6 py-3 text-sm font-black text-white transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={status === "loading" || outOfStock}
                    onClick={addToCart}
                    type="button"
                  >
                    {outOfStock ? "Out of stock" : status === "loading" ? "Adding…" : "Add to cart"}
                  </button>
                  <button
                    className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={buyNowLoading || outOfStock}
                    onClick={buyNow}
                    type="button"
                  >
                    {buyNowLoading ? "Please wait…" : "Buy now"}
                  </button>
                </>
              )}
            </div>

            {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}
          </div>

          <div>
            <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-900">
              {images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={product.title} className="h-full w-full object-cover" src={images[activeImage]} />
              ) : (
                <span className="text-sm text-white/40">No image</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((url, i) => (
                  <button
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === activeImage ? "border-lime-300" : "border-white/10"}`}
                    key={url}
                    onClick={() => setActiveImage(i)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`${product.title} ${i + 1}`} className="h-full w-full object-cover" src={url} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Delivery</p>
            <div className="mt-2 flex gap-2">
              <input
                className="w-32 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold"
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="Pincode"
                value={pincode}
              />
              <button
                className="rounded-md bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                disabled={estimateLoading}
                onClick={checkDelivery}
                type="button"
              >
                {estimateLoading ? "Checking…" : "Check"}
              </button>
            </div>
            {estimateError && <p className="mt-2 text-xs font-bold text-red-600">{estimateError}</p>}
            {estimate && (
              <p className="mt-2 text-xs font-bold">
                {estimate.deliverable ? (
                  <span className="text-emerald-700">
                    Delivers in {estimate.estimatedDays} day{estimate.estimatedDays === 1 ? "" : "s"} ·{" "}
                    {estimate.fee > 0 ? `₹${estimate.fee} shipping` : "Free shipping"}
                    {estimate.codAvailable ? " · COD available" : ""}
                  </span>
                ) : (
                  <span className="text-red-600">Not deliverable to this pincode</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 rounded-lg bg-emerald-50 px-5 text-xs font-bold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} /> Secure payment
            </span>
            <span>3-day returns</span>
            <span>GST invoice</span>
          </div>
        </div>
      </section>

      {/* Sticky mobile bar: price + primary action, once user has scrolled past the main buy box */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-3 shadow-lg md:hidden">
        <div>
          <p className="text-xs text-slate-400">Price</p>
          <p className="font-black text-slate-950">₹{effectivePrice}</p>
        </div>
        {status === "added" ? (
          <Link className="flex-1 rounded-md bg-slate-950 py-2.5 text-center text-sm font-black text-white" href="/gaadigear/cart">
            Go to cart
          </Link>
        ) : (
          <button
            className="flex-1 rounded-md bg-emerald-500 py-2.5 text-center text-sm font-black text-slate-950 disabled:opacity-50"
            disabled={status === "loading" || outOfStock}
            onClick={addToCart}
            type="button"
          >
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>
        )}
      </div>
    </>
  );
}
