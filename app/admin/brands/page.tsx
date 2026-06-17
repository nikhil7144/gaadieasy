import { AdminBrandsManager } from "@/components/admin/AdminBrandsManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getVehicleStories, getVehicleStoryUpdates, getVehicleStoryMedia } from "@/lib/services/vehicle-stories";

export default async function AdminBrandsPage() {
  const [{ brands, categories, models }, rawStories] = await Promise.all([
    getVehicleDataSet(),
    getVehicleStories(),
  ]);

  const brandOnlyStories = rawStories.filter((s) => !s.modelId);

  const brandStories = await Promise.all(
    brandOnlyStories.map(async (story) => {
      const [updates, media] = await Promise.all([
        getVehicleStoryUpdates(story.id),
        getVehicleStoryMedia(story.id),
      ]);
      return { ...story, updates, media };
    }),
  );

  return <AdminBrandsManager brands={brands} categories={categories} models={models} brandStories={brandStories} />;
}
