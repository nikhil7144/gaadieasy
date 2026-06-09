import { AdminOffersManager } from "@/components/admin/AdminOffersManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getAdminOffers } from "@/lib/services/admin-offers";

export default async function AdminOffersPage() {
  const [offers, data] = await Promise.all([getAdminOffers(), getVehicleDataSet()]);

  return (
    <AdminOffersManager
      offers={offers}
      brands={data.brands}
      models={data.models}
      cities={data.cities}
      dealers={data.dealers}
      dealerBusinesses={data.dealerBusinesses}
    />
  );
}
