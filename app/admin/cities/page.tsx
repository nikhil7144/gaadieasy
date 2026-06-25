import { AdminCitiesManager } from "@/components/admin/AdminCitiesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminCitiesPage() {
  const { cities, states } = await getVehicleDataSet();
  return <AdminCitiesManager cities={cities} states={states} />;
}
