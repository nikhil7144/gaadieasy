import { calculateOnRoadPriceForApi } from "@/lib/services/pricing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pricing = await calculateOnRoadPriceForApi({
    brand: searchParams.get("brand") ?? undefined,
    model: searchParams.get("model") ?? undefined,
    variant: searchParams.get("variant") ?? undefined,
    city: searchParams.get("city") ?? undefined,
  });

  return Response.json({ pricing });
}
