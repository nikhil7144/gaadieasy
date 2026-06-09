import { brands, cities, models, seoPages, variants } from "@/lib/data";
import { calculateOnRoadPrice } from "@/lib/services/pricing";

export function getActiveSeoPage(slug: string) {
  return seoPages.find((page) => page.slug === slug && page.active);
}

export function getSeoPagesForNavigation() {
  return seoPages.filter((page) => page.active && (page.showInFooter || page.showOnHomepage));
}

export function getSeoPageResults(slug: string) {
  const page = getActiveSeoPage(slug);

  if (!page) {
    return undefined;
  }

  const matchingModels = models.filter((model) => {
    const modelVariants = variants.filter((variant) => variant.modelId === model.id);
    return (
      model.active &&
      (!page.filters.brandId || model.brandId === page.filters.brandId) &&
      (!page.filters.modelId || model.id === page.filters.modelId) &&
      (!page.filters.categoryId || model.categoryId === page.filters.categoryId) &&
      (!page.filters.fuelType || modelVariants.some((variant) => variant.fuelType === page.filters.fuelType))
    );
  });

  const city = cities.find((item) => item.id === page.filters.cityId) ?? cities[0];
  const pricing = matchingModels.flatMap((model) => {
    const brand = brands.find((item) => item.id === model.brandId);
    return variants
      .filter((variant) => variant.modelId === model.id)
      .slice(0, 2)
      .map((variant) =>
        calculateOnRoadPrice({
          brand: brand?.slug,
          model: model.slug,
          variant: variant.slug,
          city: city.slug,
        }),
      );
  });

  return { page, city, pricing };
}
