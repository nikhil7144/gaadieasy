import { getOnRoadPriceData } from "@/lib/services/on-road-price";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pricing = await getOnRoadPriceData({
    brand: searchParams.get("brand") ?? undefined,
    model: searchParams.get("model") ?? undefined,
    variant: searchParams.get("variant") ?? undefined,
    city: searchParams.get("city") ?? undefined,
  });

  return Response.json({ pricing });
}
