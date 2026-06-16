import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createVehicleStory, deleteVehicleStory, updateVehicleStory } from "@/lib/services/vehicle-stories";
import { vehicleStorySchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = vehicleStorySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid story", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ story: await createVehicleStory(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create story" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = vehicleStorySchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid story", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ story: await updateVehicleStory(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update story" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid story id" }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteVehicleStory(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete story" }, { status: 500 });
  }
}
