import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createCity, updateCity } from "@/lib/services/admin-catalog";
import { citySchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = citySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid city payload" }, { status: 400 });
  }

  try {
    return Response.json({ city: await createCity(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create city" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = citySchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid city update" }, { status: 400 });
  }

  try {
    return Response.json({ city: await updateCity(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update city" }, { status: 500 });
  }
}
