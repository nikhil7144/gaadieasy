import { AdminDealerShowroomsManager } from "@/components/admin/AdminDealerShowroomsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminDealerShowroomsPage() {
  const { brands, cities, dealerBrandMappings, dealerBusinesses, dealers } = await getVehicleDataSet();

  return (
    <AdminDealerShowroomsManager
      brands={brands}
      businesses={dealerBusinesses}
      cities={cities}
      dealers={dealers}
      mappings={dealerBrandMappings}
    />
  );
}
