import { AdminInsuranceManager } from "@/components/admin/AdminInsuranceManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminInsurancePage() {
  const { categories, insuranceRules } = await getVehicleDataSet();
  return <AdminInsuranceManager categories={categories} insuranceRules={insuranceRules} />;
}
