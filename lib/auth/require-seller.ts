import { getSellerAccessContext } from "@/lib/services/seller-auth";

export async function requireSellerContext() {
  const context = await getSellerAccessContext();
  if (!context) {
    return {
      context: null,
      response: Response.json({ error: "Seller access is required" }, { status: 401 }),
    };
  }
  return { context, response: null };
}
