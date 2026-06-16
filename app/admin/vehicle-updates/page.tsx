import { AdminVehicleStoriesManager } from "@/components/admin/AdminVehicleStoriesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getVehicleStories, getVehicleStoryMedia, getVehicleStoryUpdates } from "@/lib/services/vehicle-stories";

export default async function AdminVehicleUpdatesPage() {
  const [{ models }, rawStories] = await Promise.all([
    getVehicleDataSet(),
    getVehicleStories(),
  ]);

  const stories = await Promise.all(
    rawStories.map(async (story) => {
      const [updates, media] = await Promise.all([
        getVehicleStoryUpdates(story.id),
        getVehicleStoryMedia(story.id),
      ]);
      return { ...story, updates, media };
    }),
  );

  return <AdminVehicleStoriesManager stories={stories} models={models} />;
}
