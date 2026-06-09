import { AdminHomepageBannersManager } from "@/components/admin/AdminHomepageBannersManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminHomepageBannersPage() {
  const { heroPromotions } = await getVehicleDataSet();
  return <AdminHomepageBannersManager banners={heroPromotions} />;
}
