import {
  brands,
  categories,
  cities,
  dealerBrandMappings,
  dealers,
  models,
  rtoOffices,
  states,
  variants,
} from "@/lib/data";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export function getPublicBrands() {
  return brands.filter((brand) => brand.active);
}

export function getPublicModels(brandId?: string) {
  return models.filter((model) => model.active && (!brandId || model.brandId === brandId));
}

export function getPublicVariants(modelId?: string) {
  return variants.filter((variant) => variant.active && (!modelId || variant.modelId === modelId));
}

export function getPublicLocations() {
  return { states, cities, rtoOffices };
}

export function getPublicHomepageData() {
  const featuredModels = models.filter((model) => model.active && model.featured);
  const activeBrands = brands.filter((brand) => brand.active);

  return {
    categories,
    brands: activeBrands,
    models: featuredModels.map((model) => ({
      ...model,
      brand: brands.find((brand) => brand.id === model.brandId),
      variants: variants.filter((variant) => variant.modelId === model.id),
    })),
    cities,
  };
}

export async function getPublicHomepageDataForApi() {
  const data = await getVehicleDataSet();
  const featuredModels = data.models.filter((model) => model.active && model.featured);
  const activeBrands = data.brands.filter((brand) => brand.active);
  const activeModels = (featuredModels.length ? featuredModels : data.models.filter((model) => model.active)).map((model) => {
    const primaryMedia = data.media
      .filter((item) => item.active && item.modelId === model.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)[0];

    return {
      ...model,
      imageUrl: primaryMedia?.url || model.imageUrl,
      brand: data.brands.find((brand) => brand.id === model.brandId),
      category: data.categories.find((category) => category.id === model.categoryId),
      variants: data.variants.filter((variant) => variant.active && variant.modelId === model.id),
    };
  });

  return {
    categories: data.categories,
    brands: activeBrands,
    models: activeModels,
    variants: data.variants.filter((variant) => variant.active),
    cities: data.cities,
    heroPromotions: data.heroPromotions.filter((promotion) => promotion.active),
  };
}

export function getPublicDiscoveryData() {
  const activeBrands = brands.filter((brand) => brand.active);
  const activeModels = models.filter((model) => model.active);

  return {
    categories,
    brands: activeBrands,
    models: activeModels.map((model) => ({
      ...model,
      brand: brands.find((brand) => brand.id === model.brandId),
      variants: variants.filter((variant) => variant.active && variant.modelId === model.id),
    })),
    cities,
  };
}

export async function getPublicDiscoveryDataForApi() {
  const data = await getVehicleDataSet();
  const activeBrands = data.brands.filter((brand) => brand.active);
  const activeModels = data.models.filter((model) => model.active);

  return {
    categories: data.categories,
    brands: activeBrands,
    models: activeModels.map((model) => {
      const primaryMedia = data.media
        .filter((item) => item.active && item.modelId === model.id)
        .sort((a, b) => a.displayOrder - b.displayOrder)[0];

      return {
        ...model,
        imageUrl: primaryMedia?.url || model.imageUrl,
        brand: data.brands.find((brand) => brand.id === model.brandId),
        category: data.categories.find((category) => category.id === model.categoryId),
        variants: data.variants.filter((variant) => variant.active && variant.modelId === model.id),
      };
    }),
    variants: data.variants.filter((variant) => variant.active),
    cities: data.cities,
  };
}

export function findDealerForBrandCity(brandId: string, cityId: string) {
  const mapping = dealerBrandMappings
    .filter((item) => item.active && item.brandId === brandId && item.cityId === cityId)
    .sort((a, b) => {
      const dealerA = dealers.find((dealer) => dealer.id === a.dealerId)?.priority ?? 0;
      const dealerB = dealers.find((dealer) => dealer.id === b.dealerId)?.priority ?? 0;
      return dealerB - dealerA;
    })[0];

  if (!mapping) {
    return undefined;
  }

  return dealers.find((dealer) => dealer.id === mapping.dealerId && dealer.active && dealer.verified);
}

export async function getPublicBrandsForApi() {
  const data = await getVehicleDataSet();
  return data.brands.filter((brand) => brand.active);
}

export async function getPublicModelsForApi(brandId?: string) {
  const data = await getVehicleDataSet();
  return data.models.filter((model) => model.active && (!brandId || model.brandId === brandId));
}

export async function getPublicVariantsForApi(modelId?: string) {
  const data = await getVehicleDataSet();
  return data.variants.filter((variant) => variant.active && (!modelId || variant.modelId === modelId));
}

export async function getPublicLocationsForApi() {
  const data = await getVehicleDataSet();
  return { states: data.states, cities: data.cities, rtoOffices: data.rtoOffices };
}

export async function findDealerForBrandCityFromApi(brandId: string, cityId: string) {
  const data = await getVehicleDataSet();
  const mapping = data.dealerBrandMappings
    .filter((item) => item.active && item.brandId === brandId && item.cityId === cityId)
    .sort((a, b) => {
      const dealerA = data.dealers.find((dealer) => dealer.id === a.dealerId)?.priority ?? 0;
      const dealerB = data.dealers.find((dealer) => dealer.id === b.dealerId)?.priority ?? 0;
      return dealerB - dealerA;
    })[0];

  if (!mapping) {
    return undefined;
  }

  return data.dealers.find((dealer) => dealer.id === mapping.dealerId && dealer.active && dealer.verified);
}
