import { getGearProductsPLP } from "@/lib/services/gear-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await getGearProductsPLP({
    vehicleType: searchParams.get("vehicle_type") ?? undefined,
    category: searchParams.get("subcategory") ?? searchParams.get("category") ?? undefined,
    modelId: searchParams.get("model_id") ?? undefined,
    brandId: searchParams.get("brand_id") ?? undefined,
    brandName: searchParams.get("brand") ?? undefined,
    segment: searchParams.get("segment") ?? undefined,
    usage: searchParams.get("usage") ?? undefined,
    priceMin: searchParams.has("price_min") ? Number(searchParams.get("price_min")) : undefined,
    priceMax: searchParams.has("price_max") ? Number(searchParams.get("price_max")) : undefined,
    sort: (searchParams.get("sort") as "popularity" | "price_asc" | "price_desc" | null) ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined,
  });

  return Response.json(result);
}
