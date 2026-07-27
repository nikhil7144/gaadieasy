import { GearCatalogRebuild } from "@/components/admin/gaadigear/GearCatalogRebuild";
import { GearProductsList } from "@/components/admin/gaadigear/GearProductsList";
import { getGearCategories, getGearProducts } from "@/lib/services/gear-admin";

export default async function AdminGearProductsPage() {
  const [products, categories] = await Promise.all([getGearProducts(), getGearCategories()]);
  return (
    <div className="space-y-4">
      <GearCatalogRebuild />
      <GearProductsList categories={categories} products={products} />
    </div>
  );
}
