import { searchPublicCatalogForApi } from "@/lib/services/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  return Response.json({
    results: await searchPublicCatalogForApi(q),
  });
}
