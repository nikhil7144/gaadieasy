import { redirect } from "next/navigation";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { GearCheckoutForm } from "@/components/shared/GearCheckoutForm";
import { GearGuestCheckoutGate } from "@/components/shared/GearGuestCheckoutGate";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart, getCurrentBuyerId } from "@/lib/services/gear-cart";
import { getPublicGearCategories } from "@/lib/services/gear-public";

export default async function GearCheckoutPage() {
  const [cart, categories, buyerId] = await Promise.all([getCart(), getPublicGearCategories(), getCurrentBuyerId()]);
  if (cart.items.length === 0) redirect("/gaadigear/cart");

  const checkoutContent = (
    <>
      <GearCheckoutForm initialCart={cart} />
      <SiteFooter />
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      {buyerId ? checkoutContent : <GearGuestCheckoutGate redirectTo="/gaadigear/checkout">{checkoutContent}</GearGuestCheckoutGate>}
    </div>
  );
}
