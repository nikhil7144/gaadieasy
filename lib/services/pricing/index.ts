import {
  brands,
  categories,
  cityPages,
  cities,
  dealerBrandMappings,
  dealers,
  gstRules,
  heroPromotions,
  insuranceRules,
  models,
  offers,
  registrationFeeRules,
  rtoCharges,
  rtoOffices,
  states,
  taxRules,
  variants,
} from "@/lib/data";
import { getVehicleDataSet, type VehicleDataSet } from "@/lib/repositories/vehicle-data";
import { batchGetCachedPricing, getCachedPricing, setCachedPricing } from "@/lib/services/pricing-cache";
import type { PricingResult, PricingVehicleClass, StateTaxRule } from "@/types/automobile";

type PricingQuery = {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
};

type RoadTaxFallbackRule = {
  minPrice: number;
  maxPrice?: number;
  percent: number;
};

const EXACT_CAR_ROAD_TAX_RULES: Record<string, RoadTaxFallbackRule[]> = {
  "andhra-pradesh": [
    { minPrice: 0, maxPrice: 1000000, percent: 12 },
    { minPrice: 1000001, percent: 14 },
  ],
  assam: [
    { minPrice: 0, maxPrice: 500000, percent: 6 },
    { minPrice: 500001, maxPrice: 2000000, percent: 10 },
    { minPrice: 2000001, percent: 14 },
  ],
  bihar: [
    { minPrice: 0, maxPrice: 500000, percent: 9 },
    { minPrice: 500001, maxPrice: 2000000, percent: 10 },
    { minPrice: 2000001, percent: 12 },
  ],
  chhattisgarh: [
    { minPrice: 0, maxPrice: 500000, percent: 5 },
    { minPrice: 500001, percent: 6 },
  ],
  goa: [
    { minPrice: 0, maxPrice: 1000000, percent: 9 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 12 },
    { minPrice: 2000001, percent: 15 },
  ],
  gujarat: [{ minPrice: 0, percent: 6 }],
  haryana: [
    { minPrice: 0, maxPrice: 500000, percent: 5 },
    { minPrice: 500001, maxPrice: 2000000, percent: 8 },
    { minPrice: 2000001, percent: 10 },
  ],
  "himachal-pradesh": [
    { minPrice: 0, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, percent: 7 },
  ],
  jharkhand: [
    { minPrice: 0, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, percent: 15 },
  ],
  karnataka: [
    { minPrice: 0, maxPrice: 500000, percent: 13 },
    { minPrice: 500001, maxPrice: 1000000, percent: 14 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 17 },
    { minPrice: 2000001, percent: 18 },
  ],
  kerala: [
    { minPrice: 0, maxPrice: 500000, percent: 10 },
    { minPrice: 500001, maxPrice: 1000000, percent: 13 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 17 },
    { minPrice: 2000001, percent: 22 },
  ],
  "madhya-pradesh-petrol": [
    { minPrice: 0, maxPrice: 1000000, percent: 8 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 10 },
    { minPrice: 2000001, percent: 14 },
  ],
  "madhya-pradesh-cng": [
    { minPrice: 0, maxPrice: 1000000, percent: 8 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 10 },
    { minPrice: 2000001, percent: 14 },
  ],
  "madhya-pradesh-diesel": [
    { minPrice: 0, maxPrice: 1000000, percent: 10 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 12 },
    { minPrice: 2000001, percent: 16 },
  ],
  "maharashtra-petrol": [
    { minPrice: 0, maxPrice: 1000000, percent: 11 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 12 },
    { minPrice: 2000001, percent: 13 },
  ],
  "maharashtra-diesel": [
    { minPrice: 0, maxPrice: 1000000, percent: 13 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 14 },
    { minPrice: 2000001, percent: 15 },
  ],
  "maharashtra-cng": [
    { minPrice: 0, maxPrice: 1000000, percent: 8 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 9 },
    { minPrice: 2000001, percent: 10 },
  ],
  "maharashtra-lpg": [
    { minPrice: 0, maxPrice: 1000000, percent: 8 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 9 },
    { minPrice: 2000001, percent: 10 },
  ],
  manipur: [
    { minPrice: 0, maxPrice: 500000, percent: 5 },
    { minPrice: 500001, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 7 },
    { minPrice: 2000001, percent: 8 },
  ],
  meghalaya: [
    { minPrice: 0, maxPrice: 500000, percent: 6 },
    { minPrice: 500001, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 8 },
    { minPrice: 2000001, percent: 10 },
  ],
  nagaland: [{ minPrice: 0, percent: 6 }],
  odisha: [
    { minPrice: 0, maxPrice: 500000, percent: 6 },
    { minPrice: 500001, maxPrice: 1000000, percent: 8 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 10 },
    { minPrice: 2000001, percent: 20 },
  ],
  punjab: [
    { minPrice: 0, maxPrice: 1000000, percent: 10 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 12 },
    { minPrice: 2000001, percent: 13 },
  ],
  "tamil-nadu": [
    { minPrice: 0, maxPrice: 500000, percent: 12 },
    { minPrice: 500001, maxPrice: 1000000, percent: 13 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 18 },
    { minPrice: 2000001, percent: 20 },
  ],
  telangana: [
    { minPrice: 0, maxPrice: 500000, percent: 13 },
    { minPrice: 500001, maxPrice: 1000000, percent: 14 },
    { minPrice: 1000001, maxPrice: 2000000, percent: 18 },
    { minPrice: 2000001, percent: 21 },
  ],
  "uttar-pradesh": [
    { minPrice: 0, maxPrice: 1000000, percent: 9 },
    { minPrice: 1000001, percent: 11 },
  ],
  uttarakhand: [
    { minPrice: 0, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, percent: 8 },
  ],
  "west-bengal": [
    { minPrice: 0, maxPrice: 1000000, percent: 5.5 },
    { minPrice: 1000001, percent: 10 },
  ],
  "delhi-petrol": [
    { minPrice: 0, maxPrice: 600000, percent: 4 },
    { minPrice: 600001, maxPrice: 1000000, percent: 7 },
    { minPrice: 1000001, percent: 10 },
  ],
  "delhi-cng": [
    { minPrice: 0, maxPrice: 600000, percent: 4 },
    { minPrice: 600001, maxPrice: 1000000, percent: 7 },
    { minPrice: 1000001, percent: 10 },
  ],
  "delhi-diesel": [
    { minPrice: 0, maxPrice: 600000, percent: 5 },
    { minPrice: 600001, maxPrice: 1000000, percent: 8.75 },
    { minPrice: 1000001, percent: 12.5 },
  ],
  chandigarh: [
    { minPrice: 0, maxPrice: 1000000, percent: 10 },
    { minPrice: 1000001, percent: 12 },
  ],
  puducherry: [
    { minPrice: 0, maxPrice: 1000000, percent: 4 },
    { minPrice: 1000001, percent: 7 },
  ],
  ladakh: [
    { minPrice: 0, maxPrice: 1000000, percent: 6 },
    { minPrice: 1000001, percent: 9 },
  ],
};

const BIKE_ROAD_TAX_RULES: Record<string, RoadTaxFallbackRule[]> = {
  karnataka: [
    { minPrice: 0, maxPrice: 100000, percent: 10 },
    { minPrice: 100001, maxPrice: 200000, percent: 12 },
    { minPrice: 200001, percent: 18 },
  ],
  maharashtra: [
    { minPrice: 0, maxPrice: 100000, percent: 10 },
    { minPrice: 100001, percent: 12 },
  ],
  delhi: [
    { minPrice: 0, maxPrice: 50000, percent: 4 },
    { minPrice: 50001, maxPrice: 200000, percent: 6 },
    { minPrice: 200001, percent: 8 },
  ],
  telangana: [
    { minPrice: 0, maxPrice: 100000, percent: 10 },
    { minPrice: 100001, maxPrice: 200000, percent: 12 },
    { minPrice: 200001, percent: 14 },
  ],
  "tamil-nadu": [
    { minPrice: 0, maxPrice: 100000, percent: 10 },
    { minPrice: 100001, maxPrice: 200000, percent: 12 },
    { minPrice: 200001, percent: 14 },
  ],
};

function matchByIdOrSlug<T extends { id: string; slug?: string; name?: string }>(items: T[], value?: string) {
  if (!value) return undefined;
  const normalizedValue = decodeURIComponent(value).trim().toLowerCase();
  return items.find(
    (item) =>
      item.id === value ||
      item.slug?.toLowerCase() === normalizedValue ||
      item.name?.toLowerCase() === normalizedValue,
  );
}

function normalizeStateName(value?: string) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferVehicleTaxKind(input: {
  categorySlug?: string;
  bodyType?: string;
  fuelType: string;
  engineCapacity?: string;
  exShowroomPrice: number;
  seatingCapacity?: number;
  specs?: Record<string, unknown>;
}): PricingVehicleClass {
  const categorySlug = (input.categorySlug ?? "").toLowerCase();
  const bodyType = (input.bodyType ?? "").toLowerCase();
  const fuel = input.fuelType.toLowerCase();
  const specText = JSON.stringify(input.specs ?? {}).toLowerCase();
  const isElectric = fuel === "electric";
  const isPassengerCommercial = bodyType.includes("bus") || specText.includes("bus") || specText.includes("passenger vehicle");

  const isBikeLike =
    categorySlug === "bikes" ||
    categorySlug === "scooters" ||
    bodyType.includes("bike") ||
    bodyType.includes("scooter") ||
    Boolean((input.specs as { bike?: unknown } | undefined)?.bike);

  if (isBikeLike) {
    if (isElectric) return "ev_two_wheeler";
    return categorySlug === "scooters" ? "scooter" : "bike";
  }

  const isCommercial =
    categorySlug === "commercial-vehicles" ||
    categorySlug === "ev-commercial-vehicles" ||
    categorySlug === "passenger-ev-vehicles" ||
    Boolean((input.specs as { commercial?: unknown } | undefined)?.commercial);

  if (isCommercial) {
    if (isElectric && isPassengerCommercial) return categorySlug === "passenger-ev-vehicles" ? "passenger_ev" : "ev_commercial_passenger";
    if (isElectric) return categorySlug === "passenger-ev-vehicles" ? "loading_ev" : "ev_commercial_loading";
    return isPassengerCommercial ? "commercial_passenger" : "commercial_loading";
  }

  if (isElectric) return "car";
  return "car";
}

function gstPercentForVehicle(data: VehicleDataSet, vehicleClass: PricingVehicleClass) {
  return data.gstRules.find((rule) => rule.active && rule.vehicleClass === vehicleClass)?.gstPercent;
}

function registrationRuleForVehicle(data: VehicleDataSet, vehicleClass: PricingVehicleClass) {
  return data.registrationFeeRules.find((rule) => rule.active && rule.vehicleClass === vehicleClass);
}

function fallbackRoadTaxPercent(input: {
  stateName: string;
  fuelType: string;
  taxKind: PricingVehicleClass;
  exShowroomPrice: number;
}) {
  const stateKey = normalizeStateName(input.stateName);

  if (
    input.taxKind === "commercial_loading" ||
    input.taxKind === "commercial_passenger" ||
    input.taxKind === "ev_commercial_loading" ||
    input.taxKind === "ev_commercial_passenger" ||
    input.taxKind === "loading_ev" ||
    input.taxKind === "passenger_ev"
  ) {
    return undefined;
  }

  if (input.taxKind === "bike" || input.taxKind === "scooter" || input.taxKind === "ev_two_wheeler") {
    const bikeRules = BIKE_ROAD_TAX_RULES[stateKey];
    if (!bikeRules) return undefined;
    return bikeRules.find((rule) => input.exShowroomPrice >= rule.minPrice && (rule.maxPrice === undefined || input.exShowroomPrice <= rule.maxPrice))?.percent;
  }

  const fuel = input.fuelType.toLowerCase();
  const stateFuelKey =
    fuel === "diesel" || fuel === "cng" || fuel === "lpg" || fuel === "petrol"
      ? `${stateKey}-${fuel}`
      : stateKey;
  const rules = EXACT_CAR_ROAD_TAX_RULES[stateFuelKey] ?? EXACT_CAR_ROAD_TAX_RULES[stateKey];
  if (!rules) return undefined;
  return rules.find((rule) => input.exShowroomPrice >= rule.minPrice && (rule.maxPrice === undefined || input.exShowroomPrice <= rule.maxPrice))?.percent;
}

function taxRuleSpecificity(rule: StateTaxRule, categoryId: string) {
  // Lower = higher priority
  // Same category + specific fuelType = 0 (best)
  // Cross-category + specific fuelType = 1 (EV override rules)
  // Same category + null fuelType = 2 (generic fallback)
  return (rule.fuelType ? 0 : 2) + (rule.categoryId === categoryId ? 0 : 1);
}

function findTaxRule(input: {
  stateId: string;
  categoryId: string;
  fuelType: string;
  exShowroomPrice: number;
}) {
  const rules = taxRules.filter((rule) => {
    const maxOk = rule.maxPrice === undefined || input.exShowroomPrice <= rule.maxPrice;
    const categoryMatch = rule.categoryId === input.categoryId;
    const fuelMatch = !rule.fuelType || rule.fuelType === input.fuelType;
    // Cross-category rules apply only when they specify an exact fuel type that matches
    const crossCategoryOverride = Boolean(rule.fuelType) && rule.fuelType === input.fuelType;
    return (
      rule.active &&
      rule.stateId === input.stateId &&
      (categoryMatch || crossCategoryOverride) &&
      input.exShowroomPrice >= rule.minPrice &&
      maxOk &&
      fuelMatch
    );
  }).sort((a, b) => taxRuleSpecificity(a, input.categoryId) - taxRuleSpecificity(b, input.categoryId));

  return rules[0] as StateTaxRule | undefined;
}

function findTaxRuleFromData(data: VehicleDataSet, input: {
  stateId: string;
  categoryId: string;
  fuelType: string;
  exShowroomPrice: number;
}) {
  const rules = data.taxRules.filter((rule) => {
    const maxOk = rule.maxPrice === undefined || input.exShowroomPrice <= rule.maxPrice;
    const categoryMatch = rule.categoryId === input.categoryId;
    const fuelMatch = !rule.fuelType || rule.fuelType === input.fuelType;
    const crossCategoryOverride = Boolean(rule.fuelType) && rule.fuelType === input.fuelType;
    return (
      rule.active &&
      rule.stateId === input.stateId &&
      (categoryMatch || crossCategoryOverride) &&
      input.exShowroomPrice >= rule.minPrice &&
      maxOk &&
      fuelMatch
    );
  }).sort((a, b) => taxRuleSpecificity(a, input.categoryId) - taxRuleSpecificity(b, input.categoryId));

  return rules[0] as StateTaxRule | undefined;
}

function findDealerForBrandCityFromData(data: VehicleDataSet, brandId: string, cityId: string) {
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

function isPublicOfferLive(item: VehicleDataSet["offers"][number]) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    item.active &&
    (item.approvalStatus ?? "approved") === "approved" &&
    (!item.startDate || item.startDate <= today) &&
    (!item.endDate || item.endDate >= today)
  );
}

export function calculateOnRoadPriceFromData(query: PricingQuery, data: VehicleDataSet): PricingResult {
  const requestedModel =
    matchByIdOrSlug(data.models.filter((item) => item.active), query.model) ??
    matchByIdOrSlug(data.models, query.model);
  const requestedBrand = matchByIdOrSlug(data.brands, query.brand);
  const brand =
    (requestedModel ? data.brands.find((item) => item.id === requestedModel.brandId) : requestedBrand) ??
    requestedBrand ??
    data.brands[0] ??
    brands[0];
  const brandModels = data.models.filter((item) => item.brandId === brand.id && item.active);
  const model = requestedModel ?? brandModels[0] ?? data.models[0] ?? models[0];
  const modelVariants = data.variants
    .filter((item) => item.modelId === model.id && item.active)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice);
  const defaultVariant = modelVariants.find((item) => item.isDefault);
  const variant = matchByIdOrSlug(modelVariants, query.variant) ?? defaultVariant ?? modelVariants[0] ?? data.variants[0] ?? variants[0];
  const city = matchByIdOrSlug(data.cities, query.city) ?? data.cities[0] ?? cities[0];
  const state = data.states.find((item) => item.id === city.stateId) ?? data.states[0] ?? states[0];
  const category = data.categories.find((item) => item.id === model.categoryId) ?? data.categories[0] ?? categories[0];
  const rto = data.rtoOffices.find((item) => item.id === city.defaultRtoId || item.cityId === city.id);
  const taxRule = findTaxRule({
    stateId: state.id,
    categoryId: category.id,
    fuelType: variant.fuelType,
    exShowroomPrice: variant.exShowroomPrice,
  });
  const dbTaxRule = findTaxRuleFromData(data, {
    stateId: state.id,
    categoryId: category.id,
    fuelType: variant.fuelType,
    exShowroomPrice: variant.exShowroomPrice,
  });
  const rtoCharge = data.rtoCharges.find((item) => item.active && item.cityId === city.id);
  const insuranceRule =
    data.insuranceRules.find((item) => item.active && item.categoryId === category.id && item.fuelType === variant.fuelType) ??
    data.insuranceRules.find((item) => item.active && item.categoryId === category.id);
  const offer = data.offers.find(
    (item) =>
      isPublicOfferLive(item) &&
      (!item.brandId || item.brandId === brand.id) &&
      (!item.modelId || item.modelId === model.id) &&
      (!item.cityId || item.cityId === city.id),
  );
  const dealer = findDealerForBrandCityFromData(data, brand.id, city.id);
  const dealerOffers = data.offers.filter(
    (item) =>
      isPublicOfferLive(item) &&
      item.placement === "dealer_card" &&
      (!item.dealerBusinessId || item.dealerBusinessId === dealer?.dealerBusinessId) &&
      (!item.dealerId || item.dealerId === dealer?.id) &&
      (!item.brandId || item.brandId === brand.id) &&
      (!item.modelId || item.modelId === model.id) &&
      (!item.cityId || item.cityId === city.id),
  );

  const taxKind = inferVehicleTaxKind({
    categorySlug: category.slug,
    bodyType: model.bodyType,
    fuelType: variant.fuelType,
    engineCapacity: variant.engineCapacity,
    exShowroomPrice: variant.exShowroomPrice,
    seatingCapacity: variant.seatingCapacity,
    specs: variant.specifications as Record<string, unknown>,
  });
  const gstPercent = gstPercentForVehicle(data, taxKind) ?? (variant.fuelType === "Electric" ? 5 : 28);
  const gstAmount = Math.round((variant.exShowroomPrice * gstPercent) / (100 + gstPercent));

  const selectedTaxRule = dbTaxRule ?? taxRule;
  let roadTax = 0;
  if (selectedTaxRule) {
    const baseTax = variant.exShowroomPrice * (selectedTaxRule.roadTaxPercent / 100) + selectedTaxRule.fixedTaxAmount;
    const evRelief = baseTax * (selectedTaxRule.evExemptionPercent / 100);
    const luxuryCess = variant.exShowroomPrice * (selectedTaxRule.luxuryCessPercent / 100);
    roadTax = Math.round(baseTax - evRelief + luxuryCess);
  } else {
    const starterPercent = fallbackRoadTaxPercent({
      stateName: state.name,
      fuelType: variant.fuelType,
      taxKind,
      exShowroomPrice: variant.exShowroomPrice,
    });
    roadTax = starterPercent ? Math.round(variant.exShowroomPrice * (starterPercent / 100)) : 0;
  }

  const insurance = Math.round(
    insuranceRule
      ? variant.exShowroomPrice * (insuranceRule.percentOfExShowroom / 100) + insuranceRule.fixedAmount
      : variant.exShowroomPrice * 0.035,
  );
  const registrationRule = registrationRuleForVehicle(data, taxKind);
  const registrationFee = rtoCharge?.registrationFee ?? registrationRule?.registrationFee ?? 600;
  const smartCardFee = rtoCharge?.smartCardFee ?? registrationRule?.smartCardFee ?? 200;
  const numberPlateFee = rtoCharge?.numberPlateFee ?? registrationRule?.numberPlateFee ?? 1200;
  const hypothecationFee = rtoCharge?.hypothecationFee ?? registrationRule?.hypothecationFee ?? 1500;
  const fastagFee = rtoCharge?.fastagFee ?? registrationRule?.fastagFee ?? 0;
  const handlingCharges = rtoCharge?.handlingCharges ?? registrationRule?.handlingCharges ?? 0;
  const offerDiscount = offer?.discountAmount ?? 0;
  const totalOnRoadPrice =
    variant.exShowroomPrice +
    roadTax +
    registrationFee +
    insurance +
    smartCardFee +
    numberPlateFee +
    hypothecationFee +
    fastagFee +
    handlingCharges -
    offerDiscount;

  return {
    brand,
    model,
    variant,
    city,
    state,
    rto,
    dealer,
    offer,
    dealerOffers,
    breakdown: {
      exShowroomPrice: variant.exShowroomPrice,
      gstPercent,
      gstAmount,
      roadTax,
      registrationFee,
      insurance,
      smartCardFee,
      numberPlateFee,
      hypothecationFee,
      fastagFee,
      handlingCharges,
      offerDiscount,
      totalOnRoadPrice,
    },
  };
}

export function calculateOnRoadPrice(query: PricingQuery): PricingResult {
  return calculateOnRoadPriceFromData(query, {
    categories,
    brands,
    models,
    variants,
    media: [],
    states,
    cities,
    rtoOffices,
    taxRules,
    rtoCharges,
    insuranceRules,
    gstRules,
    registrationFeeRules,
    dealerBusinesses: [],
    dealers,
    dealerUsers: [],
    dealerBrandMappings,
    offers,
    heroPromotions,
    cityPages,
  });
}

export async function calculateOnRoadPriceForApi(query: PricingQuery): Promise<PricingResult> {
  const data = await getVehicleDataSet();
  return calculateOnRoadPriceFromData(query, data);
}

export async function calculateOnRoadPriceWithCache(query: PricingQuery, data: VehicleDataSet): Promise<PricingResult> {
  const result = calculateOnRoadPriceFromData(query, data);
  const cached = await getCachedPricing(result.variant.id, result.city.id);
  if (cached) return { ...result, breakdown: cached };
  setCachedPricing(result.variant.id, result.city.id, result.breakdown).catch(() => {});
  return result;
}

export async function batchCalculateWithCache(
  queries: Array<{ brand: string; model: string; variant: string; city: string; variantId: string }>,
  cityId: string,
  data: VehicleDataSet,
): Promise<PricingResult[]> {
  const variantIds = queries.map((q) => q.variantId);
  const cacheMap = await batchGetCachedPricing(variantIds, cityId);
  return queries.map((q) => {
    const result = calculateOnRoadPriceFromData(q, data);
    const cached = cacheMap.get(q.variantId);
    if (cached) return { ...result, breakdown: cached };
    setCachedPricing(q.variantId, cityId, result.breakdown).catch(() => {});
    return result;
  });
}
