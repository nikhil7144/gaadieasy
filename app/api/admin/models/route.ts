import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createModel, deleteModel, updateModel } from "@/lib/services/admin-catalog";
import { modelSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = modelSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid model", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ model: await createModel(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create model" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = modelSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid model", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ model: await updateModel(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update model" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid model", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteModel(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete model" }, { status: 500 });
  }
}
