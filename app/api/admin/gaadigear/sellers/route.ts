import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { approveSeller, rejectSeller, suspendSeller } from "@/lib/services/gear-admin";
import { sellerModerationSchema } from "@/lib/validations/gaadigear-admin";

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = sellerModerationSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid seller action", issues: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "approve") {
      return Response.json({ seller: await approveSeller(parsed.data.id) });
    }
    if (parsed.data.action === "reject") {
      return Response.json({ seller: await rejectSeller(parsed.data.id, parsed.data.reason) });
    }
    return Response.json({ seller: await suspendSeller(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update seller" }, { status: 500 });
  }
}
