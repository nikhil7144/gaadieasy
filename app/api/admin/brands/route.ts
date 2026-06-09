import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createBrand, deleteBrand, updateBrand } from "@/lib/services/admin-catalog";
import { brandSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = brandSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid brand", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ brand: await createBrand(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create brand" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = brandSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid brand", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ brand: await updateBrand(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update brand" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid brand", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteBrand(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete brand" }, { status: 500 });
  }
}
