import { getSellerAccessContext } from "@/lib/services/seller-auth";

export async function GET() {
  const context = await getSellerAccessContext();

  if (!context) {
    return Response.json({ error: "Seller access is required" }, { status: 401 });
  }

  return Response.json({
    userEmail: context.userEmail,
    sellerUser: context.sellerUser,
    seller: context.seller,
  });
}
