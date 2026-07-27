import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { approveGearProduct, rejectGearProduct, setGearProductPaused } from "@/lib/services/gear-admin";
import { gearProductModerationSchema } from "@/lib/validations/gaadigear-admin";

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = gearProductModerationSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid product action", issues: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "approve") {
      return Response.json({ product: await approveGearProduct(parsed.data.id) });
    }
    if (parsed.data.action === "reject") {
      return Response.json({ product: await rejectGearProduct(parsed.data.id, parsed.data.reason) });
    }
    return Response.json({ product: await setGearProductPaused(parsed.data.id, parsed.data.action === "pause") });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update product" }, { status: 500 });
  }
}
