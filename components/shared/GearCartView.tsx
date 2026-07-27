"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { GearPlpProduct } from "@/components/public/GearProductGrid";
import type { GearCart, GearCartSellerGroup } from "@/types/automobile";
import { groupCartBySellerClient } from "@/lib/utils/gear-cart-client";

async function sendJson(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function GearCartView({ initialCart, crossSell }: { initialCart: GearCart; crossSell: GearPlpProduct[] }) {
  const [cart, setCart] = useState<GearCart>(initialCart);
  const [error, setError] = useState("");
  const groups: GearCartSellerGroup[] = groupCartBySellerClient(cart);

  async function updateQty(itemId: string, qty: number) {
    setError("");
    try {
      const payload = await sendJson("/api/gear-cart/items", "PATCH", { itemId, qty });
      setCart(payload.cart);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update item");
    }
  }

  async function removeItem(itemId: string) {
    setError("");
    try {
      const payload = await sendJson("/api/gear-cart/items", "DELETE", { itemId });
      setCart(payload.cart);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove item");
    }
  }

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
        <div className="relative mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight">Your cart</h1>
          <Link className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50 transition hover:bg-white/20" href="/gaadigear/products">
            ← Continue shopping
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white py-16 text-center">
            <ShoppingBag className="text-slate-300" size={40} />
            <p className="text-sm font-bold text-slate-500">Your cart is empty.</p>
            <Link className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-400" href="/gaadigear">
              Browse GaadiGear
            </Link>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={group.sellerId}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">Sold by {group.sellerName ?? "Seller"}</p>
                {group.items.map((item) => (
                  <div className="flex items-center gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0" key={item.id}>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-100">
                      {item.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={item.title} className="h-full w-full object-cover" src={item.thumbnailUrl} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-950">{item.title}</div>
                      {item.variantLabel && <div className="text-xs text-slate-500">{item.variantLabel}</div>}
                      <div className="text-xs text-slate-500">₹{item.unitPrice}</div>
                    </div>
                    <input
                      className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center text-sm font-bold"
                      min={0}
                      onChange={(e) => updateQty(item.id, Number(e.target.value) || 0)}
                      type="number"
                      value={item.qty}
                    />
                    <div className="w-20 text-right font-bold text-slate-950">₹{item.lineTotal}</div>
                    <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => removeItem(item.id)} type="button">
                      Remove
                    </button>
                  </div>
                ))}
                <p className="mt-2 text-right text-sm font-bold text-slate-700">Subtotal: ₹{group.itemsSubtotal}</p>
              </section>
            ))}

            <div className="flex items-center justify-between rounded-lg bg-lime-300 p-4 text-slate-950">
              <div>
                <p className="text-xs font-bold uppercase text-slate-700">Items subtotal</p>
                <p className="text-xl font-black">₹{cart.itemsSubtotal}</p>
              </div>
              <Link className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800" href="/gaadigear/checkout">
                Proceed to checkout
              </Link>
            </div>
          </>
        )}

        {crossSell.length > 0 && (
          <section className="pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Cross-sell</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">You might also need</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {crossSell.map((p) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  href={`/gaadigear/products/${p.slug}`}
                  key={p.productId}
                >
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={p.title} className="h-full w-full object-cover" src={p.thumbnailUrl} />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-bold text-slate-950">{p.title}</p>
                  <p className="text-xs font-black text-emerald-700">₹{p.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
