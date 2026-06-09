import { getPublicBrandsForApi } from "@/lib/services/public-data";

export async function GET() {
  return Response.json({ brands: await getPublicBrandsForApi() });
}
