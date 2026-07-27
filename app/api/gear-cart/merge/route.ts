import { getCurrentBuyerId, mergeGuestCartOnLogin } from "@/lib/services/gear-cart";

// Called right after a buyer signs up/logs in, so any guest cart built up
// under the cart_token cookie gets folded into their account.
export async function POST() {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) return Response.json({ error: "Not signed in" }, { status: 401 });

  try {
    await mergeGuestCartOnLogin(buyerId);
    return Response.json({ merged: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to merge cart" }, { status: 500 });
  }
}
