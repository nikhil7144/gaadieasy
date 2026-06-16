import { AdminComparisonsManager } from "@/components/admin/AdminComparisonsManager";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminComparisonsPage() {
  const [{ models, variants, cities }, comparisons] = await Promise.all([
    getVehicleDataSet(),
    getComparisonPagesFromDb().catch(() => []),
  ]);

  return (
    <AdminComparisonsManager
      comparisons={comparisons}
      models={models}
      variants={variants}
      cities={cities}
    />
  );
}
