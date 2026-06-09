import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { getAdminOffers, updateAdminOffer } from "@/lib/services/admin-offers";
import { z } from "zod";

const updateOfferSchema = z.object({
  id: z.string().uuid(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ offers: await getAdminOffers() });
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = updateOfferSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid offer update", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return Response.json({ offer: await updateAdminOffer(parsed.data) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update offer" },
      { status: 500 },
    );
  }
}
