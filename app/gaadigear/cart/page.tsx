import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { GearCartView } from "@/components/shared/GearCartView";
import { GearGuestSignInBanner } from "@/components/shared/GearGuestSignInBanner";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart, getCurrentBuyerId } from "@/lib/services/gear-cart";
import { getGearProductsPLP, getPublicGearCategories } from "@/lib/services/gear-public";

export default async function GearCartPage() {
  const [cart, categories, buyerId] = await Promise.all([getCart(), getPublicGearCategories(), getCurrentBuyerId()]);
  const crossSell = cart.items.length > 0 ? (await getGearProductsPLP({ limit: 8 })).products.slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      {!buyerId && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <GearGuestSignInBanner redirectTo="/gaadigear/cart" />
        </div>
      )}
      <GearCartView crossSell={crossSell} initialCart={cart} />
      <SiteFooter />
    </div>
  );
}
