import { SellerProductEditor } from "@/components/seller/SellerProductEditor";
import { getGearCategories, getVehicleTypes } from "@/lib/services/gear-admin";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";

export default async function NewSellerProductPage() {
  const [categories, vehicleTypes, catalog] = await Promise.all([getGearCategories(), getVehicleTypes(), getSlimCatalog()]);
  const l2Categories = categories.filter((c) => c.level === 2);

  return (
    <SellerProductEditor
      brands={catalog.brands}
      categories={l2Categories}
      initialVariantCount={0}
      models={catalog.models}
      variants={catalog.variants}
      vehicleTypes={vehicleTypes}
    />
  );
}
