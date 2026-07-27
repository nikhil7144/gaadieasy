import { searchGearCatalog } from "@/lib/services/gear-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const vehicleType = searchParams.get("vehicle_type") ?? undefined;

  if (!q.trim()) return Response.json({ results: [] });

  return Response.json({ results: await searchGearCatalog(q, vehicleType) });
}
