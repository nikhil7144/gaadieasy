import { getRecommendedGearForModel } from "@/lib/services/gear-public";

export async function GET(_request: Request, { params }: { params: Promise<{ modelId: string }> }) {
  const { modelId } = await params;
  return Response.json({ products: await getRecommendedGearForModel(modelId) });
}
