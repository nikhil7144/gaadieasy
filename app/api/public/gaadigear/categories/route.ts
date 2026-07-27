import { getPublicGearCategories } from "@/lib/services/gear-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vehicleType = searchParams.get("vehicle_type") ?? undefined;

  return Response.json({ categories: await getPublicGearCategories(vehicleType) });
}
