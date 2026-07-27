"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, Smartphone } from "lucide-react";
import type { GearCart, GearCartSellerGroup } from "@/types/automobile";
import { groupCartBySellerClient } from "@/lib/utils/gear-cart-client";

const fieldClass = "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

async function sendJson(url: string, method: "POST", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", icon: Building2 },
] as const;

export function GearCheckoutForm({ initialCart }: { initialCart: GearCart }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("upi");
  const [groups, setGroups] = useState<GearCartSellerGroup[] | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);

  const baseGroups = groupCartBySellerClient(initialCart);

  async function checkServiceability(): Promise<GearCartSellerGroup[] | null> {
    setChecking(true);
    setError("");
    try {
      const payload = await sendJson("/api/gear-cart/check-serviceability", "POST", { pincode, state });
      setGroups(payload.sellerGroups);
      return payload.sellerGroups;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to check serviceability");
      return null;
    } finally {
      setChecking(false);
    }
  }

  // Order creation re-validates serviceability server-side anyway (see
  // createOrderFromCart), so a separate mandatory "check delivery" click
  // before Place Order is even clickable is just friction, not a real safety
  // requirement. If the buyer hasn't checked yet, run it here first.
  async function placeOrder() {
    setError("");
    setPlacing(true);
    try {
      let currentGroups = groups;
      if (!currentGroups) {
        currentGroups = await checkServiceability();
        if (!currentGroups) {
          setPlacing(false);
          return;
        }
      }
      if (currentGroups.some((g) => !g.deliverable)) {
        setError("Some items in your cart can't be delivered to this address. Remove them or use a different address.");
        setPlacing(false);
        return;
      }

      const payload = await sendJson("/api/gear-orders/checkout", "POST", {
        name,
        phone,
        addressLine1,
        city,
        state,
        pincode,
        paymentMethod,
      });
      router.push(`/gaadigear/orders/${payload.order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to place order");
      setPlacing(false);
    }
  }

  const anyUndeliverable = groups?.some((g) => !g.deliverable) ?? false;
  const shippingTotal = groups?.reduce((sum, g) => sum + g.shippingFee, 0) ?? 0;
  const grandTotal = initialCart.itemsSubtotal + (groups ? shippingTotal : 0);
  const canPlaceOrder = !placing && !checking && !anyUndeliverable && !!name && !!phone && !!addressLine1 && !!city && !!state && pincode.length === 6;

  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
          <div className="rounded-lg bg-lime-300 px-5 py-3 text-slate-950">
            <div className="text-xs font-bold uppercase text-slate-700">Total payable</div>
            <div className="text-2xl font-black">₹{grandTotal}</div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {error && <p className="mb-3 text-sm font-bold text-red-600">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Step 1</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Delivery address</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Full name">
                  <input className={fieldClass} onChange={(e) => setName(e.target.value)} value={name} />
                </Field>
                <Field label="Phone">
                  <input className={fieldClass} onChange={(e) => setPhone(e.target.value)} value={phone} />
                </Field>
                <Field className="md:col-span-2" label="Address">
                  <input className={fieldClass} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Flat, street, locality" value={addressLine1} />
                </Field>
                <Field label="City">
                  <input className={fieldClass} onChange={(e) => setCity(e.target.value)} value={city} />
                </Field>
                <Field label="State">
                  <input className={fieldClass} onChange={(e) => setState(e.target.value)} value={state} />
                </Field>
                <Field label="Pincode">
                  <input className={fieldClass} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} value={pincode} />
                </Field>
              </div>

              <button
                className="mt-3 text-sm font-bold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={checking || !pincode || !state}
                onClick={checkServiceability}
                type="button"
              >
                {checking ? "Checking…" : "Check delivery & shipping fee"}
              </button>

              {groups && (
                <div className="mt-3 space-y-1 rounded-md border border-emerald-100 bg-emerald-50 p-3">
                  {groups.map((g) => (
                    <div className="flex items-center justify-between text-sm" key={g.sellerId}>
                      <span className="font-bold text-slate-950">{g.sellerName ?? "Seller"}</span>
                      {g.deliverable ? (
                        <span className="font-bold text-emerald-700">{g.shippingFee > 0 ? `₹${g.shippingFee} shipping` : "Free shipping"}</span>
                      ) : (
                        <span className="font-bold text-red-600">{g.serviceabilityNote}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Step 2</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Payment method</h2>
              <div className="mt-3 space-y-2">
                {paymentMethods.map(({ id, label, icon: Icon }) => (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-md border-2 px-3 py-2.5 text-sm font-black transition ${
                      paymentMethod === id ? "border-emerald-400 bg-emerald-50" : "border-slate-200"
                    }`}
                    key={id}
                  >
                    <input checked={paymentMethod === id} name="paymentMethod" onChange={() => setPaymentMethod(id)} type="radio" />
                    <Icon className="text-slate-500" size={18} />
                    {label}
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Order summary</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {baseGroups.flatMap((g) => g.items).map((item) => (
                <div className="flex items-center gap-2 text-sm" key={item.id}>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                    {item.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.title} className="h-full w-full object-cover" src={item.thumbnailUrl} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-950">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.variantLabel ? `${item.variantLabel} · ` : ""}Qty {item.qty}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-slate-950">₹{item.lineTotal}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items</span>
                <span>₹{initialCart.itemsSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{groups ? (shippingTotal > 0 ? `₹${shippingTotal}` : "Free") : "Calculated above"}</span>
              </div>
            </div>
            <div className="rounded-lg bg-lime-300 p-3 text-slate-950">
              <div className="flex items-center justify-between text-base font-black">
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>
              <p className="text-xs font-bold text-slate-700">Inclusive of GST</p>
            </div>

            <button
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              disabled={!canPlaceOrder}
              onClick={placeOrder}
              type="button"
            >
              {placing ? "Placing order…" : "Place order"}
            </button>
          </aside>
        </div>
      </main>
    </>
  );
}
