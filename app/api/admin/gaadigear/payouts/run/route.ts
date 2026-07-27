import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { runPayoutBatch } from "@/lib/services/gear-payouts";

export async function POST() {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    return Response.json({ ok: true, ...(await runPayoutBatch()) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to run payout batch" }, { status: 500 });
  }
}
