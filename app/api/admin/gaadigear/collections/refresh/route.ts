import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { refreshAllGearCollectionCaches, refreshGearCollectionCache } from "@/lib/services/gear-admin";
import { z } from "zod";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return fallback;
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid().optional() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = parsed.data.id ? await refreshGearCollectionCache(parsed.data.id) : await refreshAllGearCollectionCaches();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Unable to refresh collection cache") }, { status: 500 });
  }
}
