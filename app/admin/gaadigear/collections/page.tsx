import { GearCollectionsCacheRebuild } from "@/components/admin/gaadigear/GearCollectionsCacheRebuild";
import { GearCollectionsList } from "@/components/admin/gaadigear/GearCollectionsList";
import { GearHeroBannerManager } from "@/components/admin/gaadigear/GearHeroBannerManager";
import { GearHomepageSectionsList } from "@/components/admin/gaadigear/GearHomepageSectionsList";
import { getGearCollections, getGearHeroBanners, getGearHomepageSections, getGearProducts } from "@/lib/services/gear-admin";

export default async function AdminGearCollectionsPage() {
  const [collections, sections, products, heroBanners] = await Promise.all([
    getGearCollections(),
    getGearHomepageSections(),
    getGearProducts({ status: "live" }),
    getGearHeroBanners(),
  ]);

  return (
    <div className="space-y-8">
      <GearHeroBannerManager banners={heroBanners} />
      <GearCollectionsList collections={collections} products={products} />
      <GearHomepageSectionsList collections={collections} sections={sections} />
      <GearCollectionsCacheRebuild />
    </div>
  );
}
