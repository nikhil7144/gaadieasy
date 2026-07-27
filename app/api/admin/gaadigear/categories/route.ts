import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createGearCategory, deleteGearCategory, updateGearCategory } from "@/lib/services/gear-admin";
import { gearCategorySchema } from "@/lib/validations/gaadigear-admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearCategorySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid category", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ category: await createGearCategory(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create category" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearCategorySchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid category", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ category: await updateGearCategory(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid category", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteGearCategory(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete category" }, { status: 500 });
  }
}
