import type { Metadata } from "next";
import { VehiclePhotoExperience } from "@/components/public/VehiclePhotoExperience";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getBrandList } from "@/lib/repositories/vehicle-data";
import { getVehicleMediaForApi } from "@/lib/services/media";
import { getOnRoadPriceData } from "@/lib/services/on-road-price";

export const metadata: Metadata = {
  title: "Vehicle Photos | Gaadieasy",
  description: "View vehicle images by color, variant and model with zoomable photo details.",
};

export default async function VehiclePhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; model?: string; variant?: string; city?: string; color?: string; photo?: string }>;
}) {
  const params = await searchParams;
  const [pricing, brands] = await Promise.all([
    getOnRoadPriceData(params),
    getBrandList(),
  ]);
  const media = await getVehicleMediaForApi(pricing.model.id, pricing.variant.id);
  const title = `${pricing.brand.name} ${pricing.model.name} ${pricing.variant.name}`;
  const backParams = new URLSearchParams({
    brand: pricing.brand.slug,
    model: pricing.model.slug,
    variant: pricing.variant.slug,
    city: pricing.city.slug,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <VehiclePhotoExperience
          media={media}
          title={title}
          backHref={`/on-road-price?${backParams.toString()}#colors`}
          initialColor={params.color ? decodeURIComponent(params.color) : undefined}
          initialPhotoId={params.photo}
        />
      </main>
      <SiteFooter brandsOverride={brands} />
    </div>
  );
}
