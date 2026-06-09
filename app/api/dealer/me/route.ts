import { getDealerAccessContext } from "@/lib/services/dealer-auth";

export async function GET() {
  const context = await getDealerAccessContext();

  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  return Response.json({
    userEmail: context.userEmail,
    dealerUser: context.dealerUser,
    business: context.business,
    showroom: context.showroom,
    showrooms: context.showrooms,
  });
}
