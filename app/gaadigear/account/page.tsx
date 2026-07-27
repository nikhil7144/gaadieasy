import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart, getCurrentBuyerId } from "@/lib/services/gear-cart";
import { getOrdersForBuyer } from "@/lib/services/gear-checkout";
import { getPublicGearCategories } from "@/lib/services/gear-public";

export default async function GearAccountPage() {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect("/gaadigear/account/login");

  const [orders, categories, cart] = await Promise.all([getOrdersForBuyer(buyerId), getPublicGearCategories(), getCart()]);

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-slate-950">Your orders</h1>
          <AdminSignOutButton />
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-4">
          {orders.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">No orders yet.</p>
              <Link className="mt-3 inline-block text-sm font-bold text-emerald-700 hover:underline" href="/gaadigear">
                Browse GaadiGear
              </Link>
            </div>
          ) : (
            <div>
              {orders.map((o) => (
                <Link
                  className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-b-0 hover:bg-slate-50"
                  href={`/gaadigear/orders/${o.id}`}
                  key={o.id}
                >
                  <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-slate-950">₹{o.grandTotal}</span>
                  <span className="text-xs font-black uppercase text-emerald-700">{o.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
