import { getPublicLocationsForApi } from "@/lib/services/public-data";

export async function GET() {
  return Response.json(await getPublicLocationsForApi());
}
