import { AdminHomepageBannersManager } from "@/components/admin/AdminHomepageBannersManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminHomepageBannersPage() {
  const { heroPromotions, models, brands, media } = await getVehicleDataSet();
  const pickerModels = models
    .filter((m) => m.active)
    .map((m) => {
      const brand = brands.find((b) => b.id === m.brandId);
      const primaryMedia = media
        .filter((item) => item.active && item.modelId === m.id)
        .sort((a, b) => a.displayOrder - b.displayOrder)[0];
      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        imageUrl: primaryMedia?.url || m.imageUrl,
        brandName: brand?.name ?? "",
        brandSlug: brand?.slug ?? "",
      };
    })
    .sort((a, b) => `${a.brandName} ${a.name}`.localeCompare(`${b.brandName} ${b.name}`));
  return <AdminHomepageBannersManager banners={heroPromotions} models={pickerModels} />;
}
