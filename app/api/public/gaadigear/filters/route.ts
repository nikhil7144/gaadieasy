import { getGearFilterFacets } from "@/lib/services/gear-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const facets = await getGearFilterFacets({
    vehicleType: searchParams.get("vehicle_type") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  return Response.json(facets);
}
