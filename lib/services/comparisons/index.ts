import { comparisonPages as staticPages, cities as staticCities } from "@/lib/data";
import { getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";
import { getOnRoadPriceData, type OnRoadPageData } from "@/lib/services/on-road-price";
import type { ComparisonPage } from "@/types/automobile";

function isOnRoadPageData(value: OnRoadPageData | undefined): value is OnRoadPageData {
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
  const [allPages, browse] = await Promise.all([loadAllPages(), getBrowseDataSet()]);

  const page = allPages.find((item) => item.active && item.slug === slug);
  if (!page) return undefined;

  const city =
    browse.cities.find((c) => c.id === page.cityId) ??
    staticCities.find((c) => c.id === page.cityId) ??
    browse.cities[0];
  if (!city) return undefined;

  function vehicleFor(modelId: string, variantId: string) {
    const model = browse.models.find((m) => m.id === modelId);
    const brand = browse.brands.find((b) => b.id === model?.brandId);
    const variant = browse.variants.find((v) => v.id === variantId);
    if (!model || !brand || !variant) return undefined;
    return getOnRoadPriceData({ brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug });
  }

  const vehicles = (
    await Promise.all([
      vehicleFor(page.vehicle1ModelId, page.vehicle1VariantId),
      vehicleFor(page.vehicle2ModelId, page.vehicle2VariantId),
      page.vehicle3ModelId && page.vehicle3VariantId
        ? vehicleFor(page.vehicle3ModelId, page.vehicle3VariantId)
        : Promise.resolve(undefined),
    ])
  ).filter(isOnRoadPageData);

  return { page, city, cities: browse.cities, vehicles };
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
