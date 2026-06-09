import { getPublicVariantsForApi } from "@/lib/services/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return Response.json({ variants: await getPublicVariantsForApi(searchParams.get("modelId") ?? undefined) });
}
