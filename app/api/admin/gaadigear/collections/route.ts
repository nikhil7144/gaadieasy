import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createGearCollection, deleteGearCollection, updateGearCollection } from "@/lib/services/gear-admin";
import { gearCollectionSchema } from "@/lib/validations/gaadigear-admin";
import { z } from "zod";

// Supabase/PostgREST errors are plain objects with a `.message`, not `Error`
// instances -- `error instanceof Error` misses them and falls through to a
// generic fallback, hiding the actual DB error (e.g. an invalid timestamptz).
function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return fallback;
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearCollectionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid collection", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ collection: await createGearCollection(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to create collection") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearCollectionSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid collection", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ collection: await updateGearCollection(parsed.data) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to update collection") }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid collection", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteGearCollection(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to delete collection") }, { status: 500 });
  }
}
