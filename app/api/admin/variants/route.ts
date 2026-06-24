import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createVariant, deleteVariant, updateVariant } from "@/lib/services/admin-catalog";
import { variantSchema } from "@/lib/validations/admin";
import { z } from "zod";

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === "object" && "message" in error)
    return String((error as { message: unknown }).message);
  return JSON.stringify(error);
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = variantSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid variant", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ variant: await createVariant(parsed.data) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/variants] error:", JSON.stringify(error));
    return Response.json({ error: extractMessage(error) }, { status: 500 });
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
    console.error("[PATCH /api/admin/variants] error:", JSON.stringify(error));
    return Response.json({ error: extractMessage(error) }, { status: 500 });
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
    console.error("[DELETE /api/admin/variants] error:", JSON.stringify(error));
    return Response.json({ error: extractMessage(error) }, { status: 500 });
  }
}
