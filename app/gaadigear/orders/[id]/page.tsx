import { notFound } from "next/navigation";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { GearOrderView } from "@/components/shared/GearOrderView";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart, getCurrentBuyerId } from "@/lib/services/gear-cart";
import { getOrderSummary } from "@/lib/services/gear-checkout";
import { getPublicGearCategories } from "@/lib/services/gear-public";

export default async function GearOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, categories, cart, viewerBuyerId] = await Promise.all([
    getOrderSummary(id),
    getPublicGearCategories(),
    getCart(),
    getCurrentBuyerId(),
  ]);
  if (!order) notFound();
  // An order placed while signed in belongs to that buyer only -- a guest
  // order (no buyerId) has no account to check against, so its URL remains
  // the access credential by design (see gear-checkout's own comment).
  if (order.buyerId && order.buyerId !== viewerBuyerId) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      <GearOrderView order={order} />
      <SiteFooter />
    </div>
  );
}
