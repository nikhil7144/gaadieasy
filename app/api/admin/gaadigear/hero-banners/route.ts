import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createGearHeroBanner, deleteGearHeroBanner, updateGearHeroBanner } from "@/lib/services/gear-admin";
import { gearHeroBannerSchema } from "@/lib/validations/gaadigear-admin";
import { z } from "zod";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return fallback;
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearHeroBannerSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid hero banner", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ banner: await createGearHeroBanner(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to create hero banner") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearHeroBannerSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid hero banner", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ banner: await updateGearHeroBanner(parsed.data) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to update hero banner") }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid hero banner", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteGearHeroBanner(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to delete hero banner") }, { status: 500 });
  }
}
