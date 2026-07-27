import { getPublicDeliveryEstimate } from "@/lib/services/gear-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");
  const pincode = searchParams.get("pincode");
  if (!sellerId || !pincode) return Response.json({ error: "sellerId and pincode are required" }, { status: 400 });

  const estimate = await getPublicDeliveryEstimate(sellerId, pincode);
  return Response.json(estimate);
}
