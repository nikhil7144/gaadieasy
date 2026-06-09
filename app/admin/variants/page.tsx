import { AdminVariantsManager } from "@/components/admin/AdminVariantsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminVariantsPage({
  searchParams,
}: {
  searchParams: Promise<{ modelId?: string }>;
}) {
  const [{ modelId }, { categories, models, variants, media }] = await Promise.all([searchParams, getVehicleDataSet()]);
  return <AdminVariantsManager categories={categories} models={models} variants={variants} media={media} initialModelId={modelId} />;
}
