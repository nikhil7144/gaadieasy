import { comparisonPages as staticPages, cities as staticCities } from "@/lib/data";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";
import { calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import type { ComparisonPage, PricingResult } from "@/types/automobile";

function isPricingResult(value: PricingResult | undefined): value is PricingResult {
  return Boolean(value);
}

async function loadAllPages(): Promise<ComparisonPage[]> {
  try {
    const dbPages = await getComparisonPagesFromDb();
    if (dbPages.length > 0) return dbPages;
  } catch {
    // fall through to static
  }
  return staticPages;
}

export async function getComparisonPage(slug: string) {
  const [allPages, dataset] = await Promise.all([loadAllPages(), getVehicleDataSet()]);

  const page = allPages.find((item) => item.active && item.slug === slug);
  if (!page) return undefined;

  const city =
    dataset.cities.find((c) => c.id === page.cityId) ??
    staticCities.find((c) => c.id === page.cityId) ??
    dataset.cities[0];

  function vehicleFor(modelId: string, variantId: string) {
    const model = dataset.models.find((m) => m.id === modelId);
    const brand = dataset.brands.find((b) => b.id === model?.brandId);
    const variant = dataset.variants.find((v) => v.id === variantId);
    if (!model || !brand || !variant || !city) return undefined;
    // Pass the Supabase dataset so it finds DB models, not static seed fallback
    return calculateOnRoadPriceFromData(
      { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
      dataset,
    );
  }

  const vehicles = [
    vehicleFor(page.vehicle1ModelId, page.vehicle1VariantId),
    vehicleFor(page.vehicle2ModelId, page.vehicle2VariantId),
    page.vehicle3ModelId && page.vehicle3VariantId
      ? vehicleFor(page.vehicle3ModelId, page.vehicle3VariantId)
      : undefined,
  ].filter(isPricingResult);

  return { page, city, vehicles };
}

export async function getHomepageComparisons() {
  const allPages = await loadAllPages();
  const active = allPages
    .filter((p) => p.active && p.showOnHomepage)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const results = await Promise.all(active.map((p) => getComparisonPage(p.slug)));
  return results.filter((c): c is NonNullable<typeof c> => Boolean(c));
}

export async function getFooterComparisons() {
  const allPages = await loadAllPages();
  return allPages
    .filter((p) => p.active && p.showInFooter)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
