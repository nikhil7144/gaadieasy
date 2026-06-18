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
import type { VehicleVariant } from "@/types/automobile";

function sortVariants(list: VehicleVariant[]): VehicleVariant[] {
  return [...list].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice;
  });
}

export type PublicSearchResult = {
  id: string;
  type: "brand" | "model";
  name: string;
  subtitle?: string;
  slug: string;
  href: string;
  logoUrl?: string;
  imageUrl?: string;
};

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
      variants: sortVariants(variants.filter((variant) => variant.modelId === model.id)),
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
      variants: sortVariants(data.variants.filter((variant) => variant.active && variant.modelId === model.id)),
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
      variants: sortVariants(variants.filter((variant) => variant.active && variant.modelId === model.id)),
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
        variants: sortVariants(data.variants.filter((variant) => variant.active && variant.modelId === model.id)),
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

function scoreSearchMatch(candidate: string, query: string) {
  const haystack = candidate.trim().toLowerCase();
  const needle = query.trim().toLowerCase();

  if (!haystack || !needle) return 0;
  if (haystack === needle) return 500;
  if (haystack.startsWith(needle)) return 300;

  const wordMatch = haystack
    .split(/[\s-]+/)
    .find((token) => token.startsWith(needle));

  if (wordMatch) return 220;
  if (haystack.includes(needle)) return 140;

  return 0;
}

export async function searchPublicCatalogForApi(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [] as PublicSearchResult[];
  }

  const data = await getVehicleDataSet();
  const defaultCitySlug = data.cities[0]?.slug ?? "bangalore";
  const activeBrands = data.brands.filter((brand) => brand.active);
  const activeModels = data.models.filter((model) => model.active);

  const brandResults = activeBrands.reduce<{ score: number; result: PublicSearchResult }[]>((items, brand) => {
      const score = scoreSearchMatch(brand.name, normalizedQuery);
      if (!score) return items;

      const modelCount = activeModels.filter((model) => model.brandId === brand.id).length;

      items.push({
        score,
        result: {
          id: brand.id,
          type: "brand" as const,
          name: brand.name,
          subtitle: modelCount ? `${modelCount} model${modelCount === 1 ? "" : "s"}` : "Browse models",
          slug: brand.slug,
          href: `/brands/${brand.slug}`,
          logoUrl: brand.logoUrl,
        },
      });

      return items;
    }, []);

  const modelResults = activeModels.reduce<{ score: number; result: PublicSearchResult }[]>((items, model) => {
      const brand = activeBrands.find((item) => item.id === model.brandId);
      if (!brand) return items;

      const score = Math.max(
        scoreSearchMatch(model.name, normalizedQuery),
        scoreSearchMatch(`${brand.name} ${model.name}`, normalizedQuery),
      );

      if (!score) return items;

      const defaultVariant =
        data.variants.find((variant) => variant.active && variant.modelId === model.id && variant.isDefault) ??
        data.variants.find((variant) => variant.active && variant.modelId === model.id);

      const params = new URLSearchParams({
        brand: brand.slug,
        model: model.slug,
        city: defaultCitySlug,
      });

      if (defaultVariant?.slug) {
        params.set("variant", defaultVariant.slug);
      }

      items.push({
        score,
        result: {
          id: model.id,
          type: "model" as const,
          name: model.name,
          subtitle: brand.name,
          slug: model.slug,
          href: `/on-road-price?${params.toString()}`,
          logoUrl: brand.logoUrl,
          imageUrl: model.imageUrl,
        },
      });

      return items;
    }, []);

  return [...modelResults, ...brandResults]
    .sort((left, right) => right.score - left.score || left.result.name.localeCompare(right.result.name))
    .map((item) => item.result)
    .slice(0, 8);
}
