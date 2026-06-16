import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createCityPage, deleteCityPage, updateCityPage } from "@/lib/services/admin-catalog";
import { cityPageSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = cityPageSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid city page", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ cityPage: await createCityPage(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create city page" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = cityPageSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid city page", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ cityPage: await updateCityPage(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update city page" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid city page id" }, { status: 400 });

  try {
    return Response.json({ cityPage: await deleteCityPage(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete city page" }, { status: 500 });
  }
}
