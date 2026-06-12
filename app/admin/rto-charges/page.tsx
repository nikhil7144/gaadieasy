import { AdminRtoChargesManager } from "@/components/admin/AdminRtoChargesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminRtoChargesPage() {
  const { cities, rtoCharges, rtoOffices, states } = await getVehicleDataSet();
  return <AdminRtoChargesManager cities={cities} rtoCharges={rtoCharges} rtoOffices={rtoOffices} states={states} />;
}
