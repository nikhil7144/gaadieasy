import type { Brand, City, VehicleCategory, VehicleModel, VehicleVariant } from "@/types/automobile";

export type DiscoveryType =
  | "cars"
  | "bikes"
  | "scooters"
  | "ev"
  | "commercial"
  | "ev-commercial"
  | "passenger-ev";

export type DiscoveryFilter = { label: string; slug: string };
export type TruckFinderGroup = {
  key: "loaderSize" | "truckType" | "application" | "tonnage" | "fuel" | "bodyType";
  label: string;
  filters: DiscoveryFilter[];
};

export type DiscoveryTab = {
  key: DiscoveryType;
  label: string;
  primaryCategorySlugs: string[];
  includedCategorySlugs: string[];
  evCategorySlugs: string[];
  filters: DiscoveryFilter[];
  truckFinderGroups?: TruckFinderGroup[];
};

export type DiscoveryModel = VehicleModel & {
  brand?: Brand;
  category?: VehicleCategory;
  variants: VehicleVariant[];
};

export type DiscoveryDataSet = {
  categories: VehicleCategory[];
  brands: Brand[];
  models: DiscoveryModel[];
  variants: VehicleVariant[];
  cities?: City[];
};

const commercialTruckFinderGroups: TruckFinderGroup[] = [
  {
    key: "loaderSize",
    label: "Loader / truck size",
    filters: [
      { label: "Small", slug: "small-loader" },
      { label: "Medium", slug: "medium-loader" },
      { label: "Large", slug: "large-loader" },
    ],
  },
  {
    key: "truckType",
    label: "Vehicle type",
    filters: [
      { label: "Mini truck", slug: "mini-truck" },
      { label: "Pickup", slug: "pickup" },
      { label: "LCV", slug: "lcv" },
      { label: "ICV", slug: "icv" },
      { label: "HCV", slug: "hcv" },
      { label: "Haulage", slug: "haulage" },
      { label: "Tipper", slug: "tipper" },
      { label: "Tractor trailer", slug: "tractor-trailer" },
      { label: "Tanker", slug: "tanker" },
      { label: "Reefer", slug: "reefer" },
      { label: "Trucks", slug: "trucks" },
    ],
  },
  {
    key: "application",
    label: "Work application",
    filters: [
      { label: "E-commerce goods", slug: "e-commerce-goods" },
      { label: "FMCG logistics", slug: "fmcg-logistics" },
      { label: "Agricultural products", slug: "agricultural-products" },
      { label: "Construction material", slug: "construction-material" },
      { label: "Mining", slug: "mining" },
      { label: "Steel logistics", slug: "steel-logistics" },
      { label: "Container logistics", slug: "container-logistics" },
      { label: "Cold chain", slug: "cold-chain" },
      { label: "City delivery", slug: "city-delivery" },
      { label: "Fleet operations", slug: "fleet-operations" },
    ],
  },
  {
    key: "tonnage",
    label: "Payload / GVW",
    filters: [
      { label: "Under 750 kg", slug: "under-750-kg" },
      { label: "750 kg to 1.5 ton", slug: "750-kg-1-5-ton" },
      { label: "1.5 to 3 ton", slug: "1-5-3-ton" },
      { label: "3 to 7.5 ton", slug: "3-7-5-ton" },
      { label: "7.5 to 19 ton", slug: "7-5-19-ton" },
      { label: "20 to 55 ton", slug: "20-55-ton" },
    ],
  },
  {
    key: "fuel",
    label: "Fuel",
    filters: [
      { label: "Diesel", slug: "diesel" },
      { label: "CNG", slug: "cng" },
      { label: "LNG", slug: "lng" },
      { label: "Electric", slug: "electric" },
    ],
  },
  {
    key: "bodyType",
    label: "Body type",
    filters: [
      { label: "Open body", slug: "open-body" },
      { label: "Closed container", slug: "closed-container" },
      { label: "Flatbed", slug: "flatbed" },
      { label: "Tipper body", slug: "tipper-body" },
      { label: "Tanker body", slug: "tanker-body" },
      { label: "Reefer body", slug: "reefer-body" },
      { label: "Box body", slug: "box-body" },
      { label: "Cab chassis", slug: "cab-chassis" },
    ],
  },
];

export const discoveryTabs: DiscoveryTab[] = [
  {
    key: "cars",
    label: "Cars",
    primaryCategorySlugs: ["cars"],
    includedCategorySlugs: ["cars"],
    evCategorySlugs: ["ev-vehicles"],
    filters: [
      { label: "SUV", slug: "suv" },
      { label: "Hatchback", slug: "hatchback" },
      { label: "Sedan", slug: "sedan" },
      { label: "Automatic", slug: "automatic" },
      { label: "Manual", slug: "manual" },
      { label: "5 seater", slug: "5-seater" },
      { label: "7 seater", slug: "7-seater" },
      { label: "Diesel", slug: "diesel" },
      { label: "Petrol", slug: "petrol" },
      { label: "CNG", slug: "cng" },
      { label: "Electric", slug: "electric" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
  {
    key: "bikes",
    label: "Bikes",
    primaryCategorySlugs: ["bikes"],
    includedCategorySlugs: ["bikes"],
    evCategorySlugs: ["ev-vehicles"],
    filters: [
      { label: "Cruiser", slug: "cruiser" },
      { label: "Commuter", slug: "commuter" },
      { label: "Sports", slug: "sports" },
      { label: "Naked sports", slug: "naked-sports" },
      { label: "Under 125cc", slug: "under-125cc" },
      { label: "Under 250cc", slug: "under-250cc" },
      { label: "Above 500cc", slug: "above-500cc" },
      { label: "Above 650cc", slug: "above-650cc" },
      { label: "Above 900cc", slug: "above-900cc" },
      { label: "Super bikes", slug: "super-bikes" },
      { label: "Electric", slug: "electric" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
  {
    key: "scooters",
    label: "Scooters",
    primaryCategorySlugs: ["scooters"],
    includedCategorySlugs: ["scooters"],
    evCategorySlugs: ["ev-vehicles"],
    filters: [
      { label: "Electric", slug: "electric" },
      { label: "Petrol", slug: "petrol" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "100 km+ range", slug: "100-km-range" },
      { label: "Family scooter", slug: "family-scooter" },
      { label: "Connected tech", slug: "connected-tech" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
  {
    key: "ev",
    label: "EV Vehicles",
    primaryCategorySlugs: ["ev-vehicles"],
    includedCategorySlugs: ["ev-vehicles", "cars", "bikes", "scooters"],
    evCategorySlugs: ["ev-vehicles"],
    filters: [
      { label: "Electric cars", slug: "electric-cars" },
      { label: "Electric scooters", slug: "electric-scooters" },
      { label: "Electric bikes", slug: "electric-bikes" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "100 km+ range", slug: "100-km-range" },
      { label: "300 km+ range", slug: "300-km-range" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    primaryCategorySlugs: ["commercial-vehicles"],
    includedCategorySlugs: ["commercial-vehicles", "ev-commercial-vehicles"],
    evCategorySlugs: ["ev-commercial-vehicles"],
    filters: [
      { label: "Small", slug: "small-loader" },
      { label: "Medium", slug: "medium-loader" },
      { label: "Large", slug: "large-loader" },
      { label: "Pickup", slug: "pickup" },
      { label: "Mini truck", slug: "mini-truck" },
      { label: "Trucks", slug: "trucks" },
      { label: "Light commercial", slug: "light-commercial" },
      { label: "Cargo", slug: "cargo" },
      { label: "3 wheeler", slug: "3-wheeler" },
      { label: "4 wheeler", slug: "4-wheeler" },
      { label: "6 wheeler", slug: "6-wheeler" },
      { label: "Payload", slug: "payload" },
      { label: "Diesel", slug: "diesel" },
      { label: "CNG", slug: "cng" },
      { label: "Electric", slug: "electric" },
      { label: "Fleet use", slug: "fleet-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
      ...commercialTruckFinderGroups.flatMap((group) => group.filters),
    ],
    truckFinderGroups: commercialTruckFinderGroups,
  },
  {
    key: "ev-commercial",
    label: "EV Commercial",
    primaryCategorySlugs: ["ev-commercial-vehicles"],
    includedCategorySlugs: ["ev-commercial-vehicles", "commercial-vehicles"],
    evCategorySlugs: ["ev-commercial-vehicles"],
    filters: [
      { label: "Small", slug: "small-loader" },
      { label: "Medium", slug: "medium-loader" },
      { label: "Large", slug: "large-loader" },
      { label: "Pickup", slug: "pickup" },
      { label: "Mini truck", slug: "mini-truck" },
      { label: "Trucks", slug: "trucks" },
      { label: "Electric", slug: "electric" },
      { label: "Cargo", slug: "cargo" },
      { label: "3 wheeler", slug: "3-wheeler" },
      { label: "4 wheeler", slug: "4-wheeler" },
      { label: "Payload", slug: "payload" },
      { label: "Fleet use", slug: "fleet-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
      ...commercialTruckFinderGroups.flatMap((group) => group.filters),
    ],
    truckFinderGroups: commercialTruckFinderGroups,
  },
  {
    key: "passenger-ev",
    label: "Passenger EV",
    primaryCategorySlugs: ["passenger-ev-vehicles"],
    includedCategorySlugs: ["passenger-ev-vehicles"],
    evCategorySlugs: ["passenger-ev-vehicles"],
    filters: [
      { label: "E-rickshaw", slug: "e-rickshaw" },
      { label: "E-auto", slug: "e-auto" },
      { label: "Passenger seating", slug: "passenger-seating" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "Route use", slug: "route-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
];

discoveryTabs.forEach((tab) => {
  const uniqueFilters = new Map<string, DiscoveryFilter>();
  tab.filters.forEach((filter) => {
    if (!uniqueFilters.has(filter.slug)) uniqueFilters.set(filter.slug, filter);
  });
  tab.filters = Array.from(uniqueFilters.values());
});

export function getDiscoveryTab(value?: string) {
  return discoveryTabs.find((tab) => tab.key === value) ?? discoveryTabs[0];
}

export function parseFilterParam(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function engineNumber(value?: string) {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function slugText(value?: string) {
  return (value ?? "").toLowerCase().replaceAll("/", " ").replaceAll("-", " ");
}

function commercialValues(model: DiscoveryModel) {
  const variant = model.variants[0];
  const specs = variant?.specifications;
  const commercial = specs && "commercial" in specs ? (specs.commercial as Record<string, unknown>) : {};
  return Object.values(commercial ?? {}).filter((value): value is string => typeof value === "string");
}

function commercialText(model: DiscoveryModel) {
  return [
    model.loaderSize,
    model.name,
    model.bodyType,
    model.variants[0]?.fuelType,
    model.variants[0]?.engineCapacity,
    model.variants[0]?.mileage,
    ...commercialValues(model),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferredLoaderSize(model: DiscoveryModel) {
  if (model.loaderSize) return model.loaderSize.toLowerCase();

  const text = commercialText(model);
  if (
    text.includes("3 wheeler") ||
    text.includes("three-wheeler") ||
    text.includes("mini truck") ||
    text.includes("mini-truck") ||
    text.includes("under 750") ||
    text.includes("750 kg")
  ) {
    return "small";
  }

  if (
    text.includes("hcv") ||
    text.includes("haulage") ||
    text.includes("tipper") ||
    text.includes("tractor") ||
    text.includes("20 to 55") ||
    text.includes("large")
  ) {
    return "large";
  }

  if (
    text.includes("medium") ||
    text.includes("lcv") ||
    text.includes("icv") ||
    text.includes("pickup") ||
    text.includes("4 wheeler") ||
    text.includes("6 wheeler") ||
    text.includes("1.5 to 3") ||
    text.includes("3 to 7.5")
  ) {
    return "medium";
  }

  return "";
}

function commercialSortRank(model: DiscoveryModel) {
  const text = commercialText(model);
  const size = inferredLoaderSize(model);

  if (size === "small") return 0;
  if (size === "medium") return 1;
  if (size === "large") return 2;
  if (text.includes("pickup")) return 3;
  if (text.includes("mini truck") || text.includes("mini-truck")) return 4;
  if (text.includes("truck")) return 5;
  return 99;
}

function hasElectricVariant(model: DiscoveryModel) {
  return model.variants.some((variant) => variant.active && variant.fuelType === "Electric");
}

function isCommercialCategorySlug(slug?: string) {
  return slug === "commercial-vehicles" || slug === "ev-commercial-vehicles";
}

export function modelBelongsToDiscoveryType(model: DiscoveryModel, tab: DiscoveryTab) {
  const categorySlug = model.category?.slug;
  const modelPrimary = categorySlug ? tab.primaryCategorySlugs.includes(categorySlug) : false;
  const modelIncluded = categorySlug ? tab.includedCategorySlugs.includes(categorySlug) : false;
  const modelIsElectric = hasElectricVariant(model);

  if (tab.key === "ev") {
    return modelPrimary || (modelIsElectric && !isCommercialCategorySlug(categorySlug));
  }

  if (tab.key === "ev-commercial") {
    return modelPrimary || (modelIsElectric && modelIncluded);
  }

  if (tab.key === "commercial") {
    return modelIncluded;
  }

  return modelPrimary;
}

export function getDiscoveryDatasetForType(data: DiscoveryDataSet, value?: string) {
  const tab = getDiscoveryTab(value);
  const models = sortDiscoveryModels(
    data.models.filter((model) => model.active && modelBelongsToDiscoveryType(model, tab)),
    tab,
  );
  const brandIds = new Set(models.map((model) => model.brandId));
  const primaryCategoryIds = new Set(
    data.categories.filter((category) => tab.primaryCategorySlugs.includes(category.slug)).map((category) => category.id),
  );
  const brands = data.brands.filter(
    (brand) =>
      brand.active &&
      (brandIds.has(brand.id) || brand.categoryIds?.some((categoryId) => primaryCategoryIds.has(categoryId))),
  );

  return { ...data, tab, brands, models };
}

export function modelSearchText(model: DiscoveryModel) {
  const variant = model.variants[0];
  const specs = variant?.specifications;
  const commercial = specs && "commercial" in specs ? (specs.commercial as Record<string, unknown>) : {};

  return [
    model.name,
    model.brand?.name,
    model.category?.name,
    model.category?.slug,
    model.bodyType,
    model.loaderSize,
    variant?.fuelType,
    variant?.transmission,
    variant?.engineCapacity,
    variant?.mileage,
    variant?.seatingCapacity ? `${variant.seatingCapacity} seater` : undefined,
    ...Object.values(commercial ?? {}).filter((value): value is string => typeof value === "string"),
    ...(variant?.specifications.features ?? []),
    ...(variant?.specifications.highlights ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesDiscoveryFilter(model: DiscoveryModel, filter: DiscoveryFilter) {
  const variant = model.variants[0];
  const text = modelSearchText(model);
  const label = filter.label.toLowerCase();
  const slug = filter.slug.toLowerCase();
  const engineCc = engineNumber(variant?.engineCapacity);

  if (slug === "dealer-offers") return true;
  if (slug === "small-loader") return inferredLoaderSize(model) === "small";
  if (slug === "medium-loader") return inferredLoaderSize(model) === "medium";
  if (slug === "large-loader") return inferredLoaderSize(model) === "large";
  if (slug === "trucks") return text.includes("truck") || text.includes("haulage") || text.includes("tipper");
  if (slug === "automatic" || slug === "manual") return variant?.transmission.toLowerCase() === slug;
  if (["electric", "diesel", "petrol", "cng", "lng"].includes(slug)) return variant?.fuelType.toLowerCase() === slug || text.includes(slug);
  if (slug === "5-seater") return variant?.seatingCapacity === 5;
  if (slug === "7-seater") return variant?.seatingCapacity === 7;
  if (slug === "under-125cc") return typeof engineCc === "number" && engineCc < 125;
  if (slug === "under-250cc") return typeof engineCc === "number" && engineCc < 250;
  if (slug === "200cc-plus") return typeof engineCc === "number" && engineCc >= 200;
  if (slug === "above-500cc") return typeof engineCc === "number" && engineCc >= 500;
  if (slug === "above-650cc") return typeof engineCc === "number" && engineCc >= 650;
  if (slug === "above-900cc") return typeof engineCc === "number" && engineCc >= 900;

  return text.includes(label) || text.includes(slugText(slug));
}

export function sortDiscoveryModels(models: DiscoveryModel[], tab: DiscoveryTab) {
  if (tab.key !== "commercial" && tab.key !== "ev-commercial") return models;

  return [...models].sort((a, b) => {
    const rankDelta = commercialSortRank(a) - commercialSortRank(b);
    if (rankDelta) return rankDelta;
    return a.name.localeCompare(b.name);
  });
}

export function filterDiscoveryModels(models: DiscoveryModel[], tab: DiscoveryTab, filterSlugs: string[]) {
  const typeModels = models.filter((model) => modelBelongsToDiscoveryType(model, tab));
  const selectedFilters = tab.filters.filter((filter) => filterSlugs.includes(filter.slug));

  if (!selectedFilters.length) return sortDiscoveryModels(typeModels, tab);

  const exactMatches = typeModels.filter((model) => selectedFilters.every((filter) => matchesDiscoveryFilter(model, filter)));
  if (exactMatches.length) return sortDiscoveryModels(exactMatches, tab);

  return sortDiscoveryModels(
    typeModels.filter((model) => selectedFilters.some((filter) => matchesDiscoveryFilter(model, filter))),
    tab,
  );
}
