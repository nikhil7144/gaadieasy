import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createVehicleStoryUpdate, deleteVehicleStoryUpdate, updateVehicleStoryUpdate } from "@/lib/services/vehicle-stories";
import { vehicleStoryUpdateSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = vehicleStoryUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid update", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ update: await createVehicleStoryUpdate(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create update" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = vehicleStoryUpdateSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid update", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ update: await updateVehicleStoryUpdate(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteVehicleStoryUpdate(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete update" }, { status: 500 });
  }
}
