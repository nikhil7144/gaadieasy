import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { BuyerLoginForm } from "@/components/shared/BuyerLoginForm";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getPublicGearCategories } from "@/lib/services/gear-public";

export default async function BuyerLoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const [{ redirect }, categories, cart] = await Promise.all([searchParams, getPublicGearCategories(), getCart()]);
  // Only ever redirect back within /gaadigear -- never trust an arbitrary
  // external URL from a query param (open-redirect risk).
  const redirectTo = redirect && redirect.startsWith("/gaadigear") ? redirect : "/gaadigear/cart";

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      <main className="mx-auto max-w-md px-4 py-10">
        <BuyerLoginForm redirectTo={redirectTo} />
      </main>
      <SiteFooter />
    </div>
  );
}
