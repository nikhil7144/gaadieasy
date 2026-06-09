import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createVariant, deleteVariant, updateVariant } from "@/lib/services/admin-catalog";
import { variantSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = variantSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid variant", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ variant: await createVariant(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create variant" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = variantSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid variant", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ variant: await updateVariant(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid variant", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteVariant(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete variant" }, { status: 500 });
  }
}
