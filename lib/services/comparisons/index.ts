import { brands, cities, comparisonPages, models, variants } from "@/lib/data";
import { calculateOnRoadPrice } from "@/lib/services/pricing";
import type { PricingResult } from "@/types/automobile";

function isPricingResult(value: PricingResult | undefined): value is PricingResult {
  return Boolean(value);
}

function vehicleFor(modelId: string, variantId: string, citySlug: string) {
  const model = models.find((item) => item.id === modelId);
  const brand = brands.find((item) => item.id === model?.brandId);
  const variant = variants.find((item) => item.id === variantId);

  if (!model || !brand || !variant) {
    return undefined;
  }

  return calculateOnRoadPrice({
    brand: brand.slug,
    model: model.slug,
    variant: variant.slug,
    city: citySlug,
  });
}

export function getComparisonPage(slug: string) {
  const page = comparisonPages.find((item) => item.active && item.slug === slug);

  if (!page) {
    return undefined;
  }

  const city = cities.find((item) => item.id === page.cityId) ?? cities[0];
  const vehicles = [
    vehicleFor(page.vehicle1ModelId, page.vehicle1VariantId, city.slug),
    vehicleFor(page.vehicle2ModelId, page.vehicle2VariantId, city.slug),
    page.vehicle3ModelId && page.vehicle3VariantId ? vehicleFor(page.vehicle3ModelId, page.vehicle3VariantId, city.slug) : undefined,
  ].filter(isPricingResult);

  return { page, city, vehicles };
}

export function getHomepageComparisons() {
  return comparisonPages
    .filter((page) => page.active && page.showOnHomepage)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((page) => getComparisonPage(page.slug))
    .filter((comparison): comparison is NonNullable<typeof comparison> => Boolean(comparison));
}

export function getFooterComparisons() {
  return comparisonPages
    .filter((page) => page.active && page.showInFooter)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
