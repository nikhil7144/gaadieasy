import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { rebuildFullCatalogCache } from "@/lib/services/gear-catalog-cache";

export async function POST() {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    const result = await rebuildFullCatalogCache();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to rebuild catalog cache" }, { status: 500 });
  }
}
