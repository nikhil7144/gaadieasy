import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import type { Brand, PricingResult, VehicleCategory, VehicleModel } from "@/types/automobile";

export type CityModelCard = {
  brand: Brand;
  model: VehicleModel;
  category: VehicleCategory;
  pricing: PricingResult;
};

export async function getCityPageView(slug: string) {
  const data = await getVehicleDataSet();
  const cityPage = data.cityPages.find((page) => page.active && page.slug === slug);
  if (!cityPage) return null;

  const city = data.cities.find((item) => item.id === cityPage.cityId);
  if (!city) return null;

  const state = data.states.find((item) => item.id === city.stateId);
  const rto = data.rtoOffices.find((item) => item.id === city.defaultRtoId || item.cityId === city.id);
  const featuredBrandSet = new Set(cityPage.featuredBrandIds);
  const activeModels = data.models.filter((model) => model.active);
  const activeBrands = data.brands.filter((brand) => brand.active);
  const activeVariants = data.variants.filter((variant) => variant.active);

  const cards = activeModels
    .map((model) => {
      const brand = activeBrands.find((item) => item.id === model.brandId);
      const category = data.categories.find((item) => item.id === model.categoryId);
      const variant =
        activeVariants.find((item) => item.modelId === model.id && item.isDefault) ??
        activeVariants
          .filter((item) => item.modelId === model.id)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice)[0];

      if (!brand || !category || !variant) return null;

      return {
        brand,
        model,
        category,
        pricing: calculateOnRoadPriceFromData(
          { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
          data,
        ),
      };
    })
    .filter((item): item is CityModelCard => Boolean(item))
    .sort((a, b) => {
      const featuredDelta = Number(featuredBrandSet.has(b.brand.id)) - Number(featuredBrandSet.has(a.brand.id));
      return featuredDelta || Number(b.model.featured) - Number(a.model.featured) || a.model.name.localeCompare(b.model.name);
    });

  const featuredModels = cards
    .filter((card) => !cityPage.featuredCategoryId || card.category.id === cityPage.featuredCategoryId)
    .slice(0, 6);

  const categorySections = data.categories
    .map((category) => ({
      category,
      models: cards.filter((card) => card.category.id === category.id).slice(0, 6),
    }))
    .filter((section) => section.models.length);

  const brandIdsWithModels = new Set(cards.map((card) => card.brand.id));
  const brands = activeBrands
    .filter((brand) => brandIdsWithModels.has(brand.id))
    .sort((a, b) => {
      const featuredDelta = Number(featuredBrandSet.has(b.id)) - Number(featuredBrandSet.has(a.id));
      return featuredDelta || a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  const dealers = data.dealers
    .filter((dealer) => dealer.active && dealer.cityId === city.id)
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.priority - a.priority)
    .slice(0, 6);

  const relatedCityPages = data.cityPages
    .filter((page) => page.active && page.id !== cityPage.id)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title))
    .slice(0, 8);

  return {
    cityPage,
    city,
    state,
    rto,
    featuredModels,
    categorySections,
    brands,
    dealers,
    relatedCityPages,
  };
}
