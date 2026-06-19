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
  key: "loaderSize" | "truckType" | "application" | "tonnage" | "fuel" | "bodyType" | "more";
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
    evCategorySlugs: [],
    filters: [
      { label: "Under 8 lakh", slug: "under-8-lakh" },
      { label: "8-15 lakh", slug: "8-15-lakh" },
      { label: "15-25 lakh", slug: "15-25-lakh" },
      { label: "Above 25 lakh", slug: "above-25-lakh" },
      { label: "SUV", slug: "suv" },
      { label: "Hatchback", slug: "hatchback" },
      { label: "Sedan", slug: "sedan" },
      { label: "Automatic", slug: "automatic" },
      { label: "Manual", slug: "manual" },
      { label: "5 seater", slug: "5-seater" },
      { label: "6 seater", slug: "6-seater" },
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
    evCategorySlugs: [],
    filters: [
      { label: "Under 1 lakh", slug: "under-1-lakh" },
      { label: "1-2 lakh", slug: "1-2-lakh" },
      { label: "2-5 lakh", slug: "2-5-lakh" },
      { label: "Above 5 lakh", slug: "above-5-lakh" },
      { label: "Cruiser", slug: "cruiser" },
      { label: "Commuter", slug: "commuter" },
      { label: "Sports", slug: "sports" },
      { label: "Naked sports", slug: "naked-sports" },
      { label: "Under 125cc", slug: "under-125cc" },
      { label: "Under 250cc", slug: "under-250cc" },
      { label: "250-500cc", slug: "250-500cc" },
      { label: "Above 500cc", slug: "above-500cc" },
      { label: "Above 650cc", slug: "above-650cc" },
      { label: "Above 900cc", slug: "above-900cc" },
      { label: "Under 20 PS", slug: "under-20-ps" },
      { label: "20-40 PS", slug: "20-40-ps" },
      { label: "Above 40 PS", slug: "above-40-ps" },
      { label: "Super bikes", slug: "super-bikes" },
      { label: "ABS", slug: "abs" },
      { label: "High mileage", slug: "high-mileage" },
      { label: "Electric", slug: "electric" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
  },
  {
    key: "scooters",
    label: "Scooters",
    primaryCategorySlugs: ["scooters"],
    includedCategorySlugs: ["scooters"],
    evCategorySlugs: [],
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
    primaryCategorySlugs: [],
    includedCategorySlugs: ["cars", "bikes", "scooters"],
    evCategorySlugs: [],
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
    includedCategorySlugs: ["commercial-vehicles"],
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
    includedCategorySlugs: ["ev-commercial-vehicles"],
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

function commercialSortRank(model: DiscoveryModel) {
  const size = model.loaderSize?.toLowerCase() ?? "";
  if (size === "small") return 0;
  if (size === "medium") return 1;
  if (size === "large") return 2;
  return 99;
}

function hasElectricVariant(model: DiscoveryModel) {
  return model.variants.some((variant) => variant.active && variant.fuelType === "Electric");
}

function isCommercialCategorySlug(slug?: string) {
  return slug === "commercial-vehicles" || slug === "ev-commercial-vehicles";
}

function isPassengerEvModel(model: DiscoveryModel) {
  const categorySlug = model.category?.slug;
  if (categorySlug) return categorySlug === "passenger-ev-vehicles";

  const text = modelSearchText(model);

  return (
    text.includes("e-rickshaw") ||
    text.includes("erickshaw") ||
    text.includes("e auto") ||
    text.includes("e-auto") ||
    text.includes("electric auto")
  );
}

function isScooterModel(model: DiscoveryModel) {
  return model.category?.slug === "scooters";
}

export function modelBelongsToDiscoveryType(model: DiscoveryModel, tab: DiscoveryTab) {
  const categorySlug = model.category?.slug;
  const modelPrimary = categorySlug ? tab.primaryCategorySlugs.includes(categorySlug) : false;
  const modelIsElectric = hasElectricVariant(model);
  const modelIsPassengerEv = isPassengerEvModel(model);
  const modelIsScooter = isScooterModel(model);
  const modelIsCommercial = isCommercialCategorySlug(categorySlug);

  if (tab.key === "ev") {
    return modelIsElectric && !modelIsCommercial && !modelIsPassengerEv;
  }

  if (tab.key === "ev-commercial") {
    return modelPrimary;
  }

  if (tab.key === "commercial") {
    return modelPrimary;
  }

  if (tab.key === "scooters") {
    return modelIsScooter && !modelIsCommercial && !modelIsPassengerEv;
  }

  if (tab.key === "passenger-ev") {
    return modelPrimary;
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
  const variant = model.variants.find((item) => item.active && item.isDefault) ?? model.variants.find((item) => item.active) ?? model.variants[0];
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

function hasTag(model: DiscoveryModel, slug: string) {
  return model.tags?.includes(slug) ?? false;
}

export function matchesDiscoveryFilter(model: DiscoveryModel, filter: DiscoveryFilter) {
  const slug = filter.slug.toLowerCase();
  const variants = model.variants ?? [];
  const primaryVariant = variants.find((v) => v.active && v.isDefault) ?? variants.find((v) => v.active) ?? variants[0];
  const variantPool = primaryVariant ? [primaryVariant] : variants;
  const bt = model.bodyType?.toLowerCase() ?? "";

  if (slug === "dealer-offers" || slug === "fleet-operations" || slug === "fleet-use") return true;

  // Loader size
  if (slug === "small-loader") return model.loaderSize?.toLowerCase() === "small";
  if (slug === "medium-loader") return model.loaderSize?.toLowerCase() === "medium";
  if (slug === "large-loader") return model.loaderSize?.toLowerCase() === "large";

  // Wheel count — noOfWheels from DB, with body_type fallback for models not yet migrated
  if (slug === "2-wheeler") return model.noOfWheels === 2 || hasTag(model, "2-wheeler");
  if (slug === "3-wheeler") {
    if (model.noOfWheels !== undefined) return model.noOfWheels === 3;
    return bt.includes("three-wheeler") || bt.includes("3-wheeler") || bt.includes("rickshaw") || bt.includes("e-auto");
  }
  if (slug === "4-wheeler") {
    if (model.noOfWheels !== undefined) return model.noOfWheels === 4;
    return bt.includes("pickup") || bt.includes("mini truck") || bt.includes("truck") || bt.includes("tipper") || bt.includes("tractor");
  }
  if (slug === "6-wheeler") return model.noOfWheels === 6 || hasTag(model, "6-wheeler");

  // Fuel type
  if (["electric", "diesel", "petrol", "cng", "lng", "hybrid"].includes(slug)) {
    return variantPool.some((v) => v.fuelType?.toLowerCase() === slug);
  }

  // Transmission
  if (slug === "automatic" || slug === "manual") {
    return variantPool.some((v) => v.transmission?.toLowerCase() === slug);
  }

  // Seating capacity
  const seatingMatch = slug.match(/^(\d+)-seater$/);
  if (seatingMatch) {
    const seats = Number(seatingMatch[1]);
    return variantPool.some((v) => v.seatingCapacity === seats);
  }

  // Body style — body_type field is the source of truth; tags extend it
  if (slug === "suv") return bt.includes("suv") || hasTag(model, "suv");
  if (slug === "hatchback") return bt.includes("hatchback") || hasTag(model, "hatchback");
  if (slug === "sedan") return bt.includes("sedan") || hasTag(model, "sedan");
  if (slug === "muv") return bt.includes("muv") || bt.includes("mpv") || hasTag(model, "muv");
  if (slug === "commuter") return bt.includes("commuter") || hasTag(model, "commuter");
  if (slug === "cruiser") return bt.includes("cruiser") || hasTag(model, "cruiser");
  if (slug === "sports") return (bt.includes("sports") && !bt.includes("naked")) || hasTag(model, "sports");
  if (slug === "naked-sports") return bt.includes("naked") || bt.includes("streetfighter") || hasTag(model, "naked-sports");
  if (slug === "super-bikes") return bt.includes("super bike") || bt.includes("superbike") || hasTag(model, "super-bikes");
  if (slug === "scooter") return bt.includes("scooter") || hasTag(model, "scooter");

  // Commercial vehicle types — body_type values: "Pickup", "Mini truck", "Light Commercial Truck", etc.
  if (slug === "pickup") return bt.includes("pickup") || hasTag(model, "pickup");
  if (slug === "mini-truck") return bt.includes("mini truck") || bt.includes("mini-truck") || bt.includes("mini pickup") || hasTag(model, "mini-truck");
  if (slug === "cargo") return bt.includes("cargo") || hasTag(model, "cargo");
  if (slug === "trucks") return bt.includes("truck") || bt.includes("tipper") || bt.includes("tractor") || hasTag(model, "trucks");
  if (slug === "light-commercial") return bt.includes("light commercial") || hasTag(model, "light-commercial");
  if (slug === "lcv") return bt.includes("light commercial") || hasTag(model, "lcv");
  if (slug === "icv") return bt.includes("medium commercial") || hasTag(model, "icv");
  if (slug === "hcv") return bt.includes("heavy") || hasTag(model, "hcv");
  if (slug === "tipper") return bt.includes("tipper") || hasTag(model, "tipper");
  if (slug === "tractor-trailer") return bt.includes("tractor") || hasTag(model, "tractor-trailer");

  // Passenger EV body types
  if (slug === "e-rickshaw") return bt.includes("rickshaw") || model.name.toLowerCase().includes("rickshaw") || hasTag(model, "e-rickshaw");
  if (slug === "e-auto") return bt.includes("e-auto") || model.name.toLowerCase().includes("e-auto") || hasTag(model, "e-auto");

  // ABS / high mileage — tag based
  if (slug === "abs") return hasTag(model, "abs");
  if (slug === "high-mileage") return hasTag(model, "high-mileage");

  // EV sub-category filters — check ALL active variants (not just primary) so dual-fuel models
  // like Nexon (petrol default + electric variant) are not excluded from EV sub-filters
  const hasElectric = variants.some((v) => v.active !== false && v.fuelType === "Electric");
  if (slug === "electric-cars") {
    return hasElectric && (model.category?.slug === "cars" || bt.includes("hatchback") || bt.includes("sedan") || bt.includes("suv") || bt.includes("muv") || bt.includes("mpv"));
  }
  if (slug === "electric-scooters") {
    return hasElectric && (model.category?.slug === "scooters" || bt.includes("scooter"));
  }
  if (slug === "electric-bikes") {
    return hasElectric && (model.category?.slug === "bikes" || bt.includes("bike") || bt.includes("e-bike"));
  }

  // Price ranges
  const priceMatches = variantPool.some((v) => {
    const price = v.exShowroomPrice ?? 0;
    if (slug === "under-8-lakh") return price > 0 && price < 800000;
    if (slug === "8-15-lakh") return price >= 800000 && price <= 1500000;
    if (slug === "15-25-lakh") return price > 1500000 && price <= 2500000;
    if (slug === "above-25-lakh") return price > 2500000;
    if (slug === "under-1-lakh") return price > 0 && price < 100000;
    if (slug === "1-2-lakh") return price >= 100000 && price <= 200000;
    if (slug === "2-5-lakh") return price > 200000 && price <= 500000;
    if (slug === "above-5-lakh") return price > 500000;
    return false;
  });
  if (priceMatches) return true;

  // Engine CC ranges (uses engineCc field)
  const ccMatches = variantPool.some((v) => {
    const cc = v.engineCc;
    if (cc === undefined) return false;
    if (slug === "under-125cc") return cc < 125;
    if (slug === "under-250cc") return cc < 250;
    if (slug === "200cc-plus") return cc >= 200;
    if (slug === "250-500cc") return cc >= 250 && cc < 500;
    if (slug === "above-500cc") return cc >= 500;
    if (slug === "above-650cc") return cc >= 650;
    if (slug === "above-900cc") return cc >= 900;
    return false;
  });
  if (ccMatches) return true;

  // Power ranges (uses maxPowerPs field)
  const powerMatches = variantPool.some((v) => {
    const ps = v.maxPowerPs;
    if (ps === undefined) return false;
    if (slug === "under-20-ps") return ps < 20;
    if (slug === "20-40-ps") return ps >= 20 && ps <= 40;
    if (slug === "above-40-ps") return ps > 40;
    return false;
  });
  if (powerMatches) return true;

  // Payload / tonnage ranges (uses payloadCapacityKg field)
  const payloadMatches = variantPool.some((v) => {
    const kg = v.payloadCapacityKg;
    if (kg === undefined) return false;
    if (slug === "under-750-kg") return kg < 750;
    if (slug === "750-kg-1-5-ton") return kg >= 750 && kg <= 1500;
    if (slug === "1-5-3-ton") return kg > 1500 && kg <= 3000;
    if (slug === "3-7-5-ton") return kg > 3000 && kg <= 7500;
    if (slug === "7-5-19-ton") return kg > 7500 && kg <= 19000;
    if (slug === "20-55-ton") return kg > 20000;
    return false;
  });
  if (payloadMatches) return true;

  // Remaining filters (fast-charging, 100-km-range, cold-chain, family-scooter, etc.) — require model tags
  return hasTag(model, slug);
}

export function sortDiscoveryModels(models: DiscoveryModel[], tab: DiscoveryTab) {
  if (tab.key !== "commercial" && tab.key !== "ev-commercial") return models;

  return [...models].sort((a, b) => {
    const rankDelta = commercialSortRank(a) - commercialSortRank(b);
    if (rankDelta) return rankDelta;
    return a.name.localeCompare(b.name);
  });
}

export function filterDiscoveryModels(
  models: DiscoveryModel[],
  tab: DiscoveryTab,
  filterSlugs: string[],
  matchMode: "all" | "any" = "all",
) {
  const typeModels = models.filter((model) => modelBelongsToDiscoveryType(model, tab));
  const selectedFilters = tab.filters.filter((filter) => filterSlugs.includes(filter.slug));

  if (!selectedFilters.length) return sortDiscoveryModels(typeModels, tab);

  const matchesSelectedFilters = (model: DiscoveryModel) => {
    if (matchMode === "any") {
      return selectedFilters.some((filter) => matchesDiscoveryFilter(model, filter));
    }

    return selectedFilters.every((filter) => matchesDiscoveryFilter(model, filter));
  };

  return sortDiscoveryModels(typeModels.filter(matchesSelectedFilters), tab);
}
