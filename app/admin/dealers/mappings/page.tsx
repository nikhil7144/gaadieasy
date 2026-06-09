import { AdminDealerMappingsManager } from "@/components/admin/AdminDealerMappingsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminDealerMappingsPage() {
  const { brands, cities, dealerBrandMappings, dealers } = await getVehicleDataSet();

  return (
    <AdminDealerMappingsManager
      brands={brands}
      cities={cities}
      dealers={dealers}
      mappings={dealerBrandMappings}
    />
  );
}
