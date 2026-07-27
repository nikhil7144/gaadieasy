import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { getPayoutPreview } from "@/lib/services/gear-payouts";

export async function GET() {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    return Response.json({ preview: await getPayoutPreview() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load payout preview" }, { status: 500 });
  }
}
