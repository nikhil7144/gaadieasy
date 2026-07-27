import { SellerAuthTabs } from "@/components/seller/SellerAuthTabs";
import { getGearCategories, getGaadiGearLandingStats } from "@/lib/services/gear-admin";

export default async function SellerLoginPage() {
  const [categories, stats] = await Promise.all([getGearCategories(), getGaadiGearLandingStats()]);
  const l1Categories = categories.filter((c) => c.level === 1 && c.isActive);

  return (
    <main className="min-h-screen">
      <SellerAuthTabs initialTab="login" l1Categories={l1Categories} stats={stats} />
    </main>
  );
}
