import { notFound } from "next/navigation";
import { GearProductDetailView } from "@/components/admin/gaadigear/GearProductDetailView";
import { getGearProductDetail, getVehicleTypes } from "@/lib/services/gear-admin";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";

export default async function AdminGearProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, vehicleTypes, catalog] = await Promise.all([getGearProductDetail(id), getVehicleTypes(), getSlimCatalog()]);
  if (!detail) notFound();

  return (
    <GearProductDetailView
      brands={catalog.brands}
      models={catalog.models}
      product={detail.product}
      variants={detail.variants}
      vehicleTypes={vehicleTypes}
      vehicleVariants={catalog.variants}
    />
  );
}
