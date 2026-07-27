import { getCart, groupCartBySeller } from "@/lib/services/gear-cart";

export async function GET() {
  try {
    const cart = await getCart();
    return Response.json({ cart, sellerGroups: groupCartBySeller(cart) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load cart" }, { status: 500 });
  }
}
