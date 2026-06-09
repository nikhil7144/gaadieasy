import { getVehicleMediaForApi } from "@/lib/services/media";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("modelId");

  if (!modelId) {
    return Response.json({ error: "modelId is required" }, { status: 400 });
  }

  return Response.json({
    media: await getVehicleMediaForApi(modelId, searchParams.get("variantId") ?? undefined),
  });
}
