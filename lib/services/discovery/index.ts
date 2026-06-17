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

function numberFromText(value?: string) {
  const match = value?.replaceAll(",", "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

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
    evCategorySlugs: ["ev-vehicles"],
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

function engineNumber(value?: string) {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function slugText(value?: string) {
  return (value ?? "").toLowerCase().replaceAll("/", " ").replaceAll("-", " ");
}

function normalizeMatchText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesBodyStyleFilter(model: DiscoveryModel, slug: string) {
  const normalizedSlug = normalizeMatchText(slug);
  if (!normalizedSlug) return false;

  const aliases: Record<string, string[]> = {
    suv: ["suv", "sports utility vehicle"],
    hatchback: ["hatchback"],
    sedan: ["sedan"],
    muv: ["muv", "multi utility vehicle"],
    commuter: ["commuter"],
    cruiser: ["cruiser"],
    sports: ["sports", "sport"],
    "naked-sports": ["naked sports", "naked sport", "streetfighter"],
    scooter: ["scooter"],
    "super-bikes": ["super bike", "superbike", "super bikes"],
    pickup: ["pickup"],
    "mini-truck": ["mini truck", "mini-truck"],
    cargo: ["cargo"],
  };

  const candidateTexts = [model.bodyType, ...model.variants.map((variant) => variant.name)].filter(Boolean);
  const normalizedCandidates = candidateTexts.map((value) => normalizeMatchText(value));
  const expectedAliases = aliases[normalizedSlug] ?? [normalizedSlug];

  return normalizedCandidates.some((candidate) => expectedAliases.some((alias) => candidate.includes(alias)));
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

function variantPowerNumberFromVariant(variant?: VehicleVariant) {
  const engine = variant?.specifications?.engine as Record<string, unknown> | undefined;
  const bike = variant?.specifications?.bike as Record<string, unknown> | undefined;
  const commercial = variant?.specifications?.commercial as Record<string, unknown> | undefined;

  const candidates = [
    typeof engine?.maxPower === "string" ? engine.maxPower : undefined,
    typeof bike?.power === "string" ? bike.power : undefined,
    typeof commercial?.power === "string" ? commercial.power : undefined,
  ];

  for (const value of candidates) {
    const parsed = numberFromText(value);
    if (typeof parsed === "number") return parsed;
  }

  return undefined;
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
  const categorySlug = model.category?.slug;
  const text = modelSearchText(model);

  return categorySlug === "scooters" || text.includes("scooter");
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

export function matchesDiscoveryFilter(model: DiscoveryModel, filter: DiscoveryFilter) {
  const text = modelSearchText(model);
  const label = filter.label.toLowerCase();
  const slug = filter.slug.toLowerCase();
  const variants = model.variants ?? [];
  const primaryVariant = variants.find((variant) => variant.active && variant.isDefault) ?? variants.find((variant) => variant.active) ?? variants[0];
  const variantPool = primaryVariant ? [primaryVariant] : variants;

  if (slug === "dealer-offers") return true;
  if (slug === "fleet-operations") return true; // advisory — any commercial vehicle can serve fleet use
  if (slug === "small-loader") return inferredLoaderSize(model) === "small";
  if (slug === "medium-loader") return inferredLoaderSize(model) === "medium";
  if (slug === "large-loader") return inferredLoaderSize(model) === "large";
  if (slug === "trucks") return text.includes("truck") || text.includes("haulage") || text.includes("tipper");

  // Truck finder — truck type slugs
  if (slug === "lcv") return text.includes("lcv") || text.includes("light commercial");
  if (slug === "icv") return text.includes("icv") || text.includes("intermediate");
  if (slug === "hcv") return text.includes("hcv") || text.includes("heavy commercial") || text.includes("heavy duty");
  if (slug === "haulage") return text.includes("haulage") || text.includes("tractor") || text.includes("trailer");
  if (slug === "tipper") return text.includes("tipper");
  if (slug === "tractor-trailer") return text.includes("tractor") || text.includes("trailer");
  if (slug === "tanker") return text.includes("tanker");
  if (slug === "reefer") return text.includes("reefer") || text.includes("refriger");

  // Truck finder — body type slugs
  if (slug === "open-body") return text.includes("open") || text.includes("flatbed") || text.includes("tipper");
  if (slug === "closed-container") return text.includes("closed") || text.includes("container") || text.includes("box");
  if (slug === "flatbed") return text.includes("flatbed") || text.includes("flat bed");
  if (slug === "tipper-body") return text.includes("tipper");
  if (slug === "tanker-body") return text.includes("tanker");
  if (slug === "reefer-body") return text.includes("reefer") || text.includes("refriger") || text.includes("cold");
  if (slug === "box-body") return text.includes("box");
  if (slug === "cab-chassis") return text.includes("cab") || text.includes("chassis");

  // Truck finder — application/use-case slugs (broad inference from truck type)
  if (slug === "cold-chain") return text.includes("reefer") || text.includes("refriger") || text.includes("cold");
  if (slug === "e-commerce-goods") return text.includes("cargo") || text.includes("delivery") || text.includes("pickup") || text.includes("mini truck") || text.includes("closed") || text.includes("lcv");
  if (slug === "fmcg-logistics") return text.includes("cargo") || text.includes("lcv") || text.includes("delivery") || text.includes("pickup") || text.includes("closed");
  if (slug === "agricultural-products") return text.includes("tipper") || text.includes("flatbed") || text.includes("open") || text.includes("pickup");
  if (slug === "construction-material") return text.includes("tipper") || text.includes("flatbed") || text.includes("hcv") || text.includes("heavy");
  if (slug === "city-delivery") return inferredLoaderSize(model) === "small" || text.includes("mini") || text.includes("pickup") || text.includes("cargo");
  if (slug === "mining") return text.includes("tipper") || text.includes("hcv") || text.includes("heavy") || text.includes("mining");
  if (slug === "steel-logistics") return text.includes("flatbed") || text.includes("haulage") || text.includes("heavy") || text.includes("trailer");
  if (slug === "container-logistics") return text.includes("container") || text.includes("hcv") || text.includes("haulage") || text.includes("trailer");

  // Truck finder — tonnage / GVW slugs
  if (slug === "under-750-kg") return text.includes("under 750") || text.includes("750 kg") || text.includes("three wheeler") || text.includes("3 wheeler") || inferredLoaderSize(model) === "small";
  if (slug === "750-kg-1-5-ton") return text.includes("750") || text.includes("1.5 ton") || text.includes("1 ton") || (inferredLoaderSize(model) === "small" && !text.includes("3 wheeler"));
  if (slug === "1-5-3-ton") return text.includes("1.5") || text.includes("2 ton") || text.includes("3 ton") || inferredLoaderSize(model) === "medium";
  if (slug === "3-7-5-ton") return text.includes("3.5") || text.includes("5 ton") || text.includes("7.5") || inferredLoaderSize(model) === "medium";
  if (slug === "7-5-19-ton") return text.includes("10 ton") || text.includes("12 ton") || text.includes("16 ton") || text.includes("icv") || text.includes("hcv");
  if (slug === "20-55-ton") return text.includes("hcv") || text.includes("heavy") || text.includes("haulage") || text.includes("tractor") || inferredLoaderSize(model) === "large";
  if (slug === "automatic" || slug === "manual") {
    return variantPool.some((variant) => variant?.transmission?.toLowerCase() === slug);
  }
  if (["electric", "diesel", "petrol", "cng", "lng"].includes(slug)) {
    return variantPool.some((variant) => variant?.fuelType?.toLowerCase() === slug);
  }
  if (slug === "5-seater") return variantPool.some((variant) => variant?.seatingCapacity === 5);
  if (slug === "6-seater") return variantPool.some((variant) => variant?.seatingCapacity === 6);
  if (slug === "7-seater") return variantPool.some((variant) => variant?.seatingCapacity === 7);

  if (["suv", "hatchback", "sedan", "muv", "commuter", "cruiser", "sports", "naked-sports", "scooter", "super-bikes", "pickup", "mini-truck", "cargo"].includes(slug)) {
    return matchesBodyStyleFilter(model, slug);
  }

  const priceMatches = variantPool.some((variant) => {
    const price = variant?.exShowroomPrice ?? 0;
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

  const engineCcMatches = variantPool.some((variant) => {
    const engineCc = engineNumber(variant?.engineCapacity);
    if (slug === "under-125cc") return typeof engineCc === "number" && engineCc < 125;
    if (slug === "under-250cc") return typeof engineCc === "number" && engineCc < 250;
    if (slug === "200cc-plus") return typeof engineCc === "number" && engineCc >= 200;
    if (slug === "250-500cc") return typeof engineCc === "number" && engineCc >= 250 && engineCc < 500;
    if (slug === "above-500cc") return typeof engineCc === "number" && engineCc >= 500;
    if (slug === "above-650cc") return typeof engineCc === "number" && engineCc >= 650;
    if (slug === "above-900cc") return typeof engineCc === "number" && engineCc >= 900;
    return false;
  });
  if (engineCcMatches) return true;

  const powerMatches = variantPool.some((variant) => {
    const power = variantPowerNumberFromVariant(variant);
    if (slug === "under-20-ps") return typeof power === "number" && power < 20;
    if (slug === "20-40-ps") return typeof power === "number" && power >= 20 && power <= 40;
    if (slug === "above-40-ps") return typeof power === "number" && power > 40;
    return false;
  });
  if (powerMatches) return true;

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
