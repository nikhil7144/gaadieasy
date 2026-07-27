import { requireSellerContext } from "@/lib/auth/require-seller";
import { getPayoutsForSeller } from "@/lib/services/gear-payouts";

export async function GET() {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  try {
    return Response.json({ payouts: await getPayoutsForSeller(guard.context.seller.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load payouts" }, { status: 500 });
  }
}
