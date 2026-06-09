import { AdminDealerBusinessesManager } from "@/components/admin/AdminDealerBusinessesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminDealerBusinessesPage() {
  const { dealerBusinesses } = await getVehicleDataSet();
  return <AdminDealerBusinessesManager businesses={dealerBusinesses} />;
}
