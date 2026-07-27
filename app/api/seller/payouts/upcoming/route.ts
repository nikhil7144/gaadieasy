import { requireSellerContext } from "@/lib/auth/require-seller";
import { getUpcomingForSeller } from "@/lib/services/gear-payouts";

export async function GET() {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  try {
    return Response.json({ upcoming: await getUpcomingForSeller(guard.context.seller.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load upcoming payouts" }, { status: 500 });
  }
}
