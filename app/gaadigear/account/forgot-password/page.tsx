import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { BuyerForgotPasswordForm } from "@/components/shared/BuyerForgotPasswordForm";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getPublicGearCategories } from "@/lib/services/gear-public";

export default async function BuyerForgotPasswordPage() {
  const [categories, cart] = await Promise.all([getPublicGearCategories(), getCart()]);

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      <main className="mx-auto max-w-md px-4 py-10">
        <BuyerForgotPasswordForm />
      </main>
      <SiteFooter />
    </div>
  );
}
