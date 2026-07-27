import { GearCategoriesList } from "@/components/admin/gaadigear/GearCategoriesList";
import { getGearCategories, getVehicleTypes } from "@/lib/services/gear-admin";

export default async function AdminGearCategoriesPage() {
  const [categories, vehicleTypes] = await Promise.all([getGearCategories(), getVehicleTypes()]);

  return <GearCategoriesList categories={categories} vehicleTypes={vehicleTypes} />;
}
