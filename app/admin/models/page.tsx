import { AdminModelsManager } from "@/components/admin/AdminModelsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminModelsPage() {
  const { brands, categories, models } = await getVehicleDataSet();
  return <AdminModelsManager brands={brands} categories={categories} models={models} />;
}
