import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import { batchSetCachedPricing } from "@/lib/services/pricing-cache";
import type { PriceBreakdown } from "@/types/automobile";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const body = (await request.json().catch(() => ({}))) as { variantIds?: string[] };

  const data = await getVehicleDataSet();
  const activeVariants = body.variantIds
    ? data.variants.filter((v) => v.active && body.variantIds!.includes(v.id))
    : data.variants.filter((v) => v.active);

  const rows: Array<{ variantId: string; cityId: string; breakdown: PriceBreakdown }> = [];

  for (const variant of activeVariants) {
    const model = data.models.find((m) => m.id === variant.modelId);
    if (!model) continue;
    const brand = data.brands.find((b) => b.id === model.brandId);
    if (!brand) continue;

    for (const city of data.cities) {
      const result = calculateOnRoadPriceFromData(
        { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
        data,
      );
      rows.push({ variantId: variant.id, cityId: city.id, breakdown: result.breakdown });
    }
  }

  await batchSetCachedPricing(rows);
  return Response.json({ ok: true, computed: rows.length, variants: activeVariants.length, cities: data.cities.length });
}
