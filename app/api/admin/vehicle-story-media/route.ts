import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { deleteVehicleStoryMedia, uploadVehicleStoryMediaFile } from "@/lib/services/vehicle-stories";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const formData = await request.formData();
  const file = formData.get("file");
  const storyId = String(formData.get("storyId") ?? "");
  const storySlug = String(formData.get("storySlug") ?? "story");
  const alt = String(formData.get("alt") ?? "");
  const displayOrder = Number(formData.get("displayOrder") ?? 0);

  if (!(file instanceof File)) return Response.json({ error: "File is required." }, { status: 400 });
  if (!storyId) return Response.json({ error: "storyId is required." }, { status: 400 });

  try {
    const media = await uploadVehicleStoryMediaFile({ storyId, storySlug, file, alt, displayOrder });
    return Response.json({ media }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload media" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteVehicleStoryMedia(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete media" }, { status: 500 });
  }
}
