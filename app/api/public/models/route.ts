import { getPublicModelsForApi } from "@/lib/services/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return Response.json({ models: await getPublicModelsForApi(searchParams.get("brandId") ?? undefined) });
}
