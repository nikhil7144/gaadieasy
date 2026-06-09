import { AdminBrandsManager } from "@/components/admin/AdminBrandsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminBrandsPage() {
  const { brands, categories } = await getVehicleDataSet();
  return <AdminBrandsManager brands={brands} categories={categories} />;
}
