import {
  brands,
  categories,
  cities,
  dealerBrandMappings,
  dealers,
  heroPromotions,
  insuranceRules,
  models,
  offers,
  rtoCharges,
  rtoOffices,
  states,
  taxRules,
  variants,
} from "@/lib/data";
import { getVehicleDataSet, type VehicleDataSet } from "@/lib/repositories/vehicle-data";
import type { PricingResult, StateTaxRule } from "@/types/automobile";

type PricingQuery = {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
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

function findTaxRule(input: {
  stateId: string;
  categoryId: string;
  fuelType: string;
  exShowroomPrice: number;
}) {
  const rules = taxRules.filter((rule) => {
    const maxOk = rule.maxPrice === undefined || input.exShowroomPrice <= rule.maxPrice;
    return (
      rule.active &&
      rule.stateId === input.stateId &&
      rule.categoryId === input.categoryId &&
      input.exShowroomPrice >= rule.minPrice &&
      maxOk &&
      (!rule.fuelType || rule.fuelType === input.fuelType)
    );
  });

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
    return (
      rule.active &&
      rule.stateId === input.stateId &&
      rule.categoryId === input.categoryId &&
      input.exShowroomPrice >= rule.minPrice &&
      maxOk &&
      (!rule.fuelType || rule.fuelType === input.fuelType)
    );
  });

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

  const selectedTaxRule = dbTaxRule ?? taxRule;
  const baseTax = selectedTaxRule
    ? variant.exShowroomPrice * (selectedTaxRule.roadTaxPercent / 100) + selectedTaxRule.fixedTaxAmount
    : variant.exShowroomPrice * 0.12;
  const evRelief = selectedTaxRule ? baseTax * (selectedTaxRule.evExemptionPercent / 100) : 0;
  const luxuryCess = selectedTaxRule ? variant.exShowroomPrice * (selectedTaxRule.luxuryCessPercent / 100) : 0;
  const roadTax = Math.round(baseTax - evRelief + luxuryCess);
  const insurance = Math.round(
    insuranceRule
      ? variant.exShowroomPrice * (insuranceRule.percentOfExShowroom / 100) + insuranceRule.fixedAmount
      : variant.exShowroomPrice * 0.035,
  );
  const registrationFee = rtoCharge?.registrationFee ?? 15000;
  const smartCardFee = rtoCharge?.smartCardFee ?? 600;
  const numberPlateFee = rtoCharge?.numberPlateFee ?? 1200;
  const hypothecationFee = rtoCharge?.hypothecationFee ?? 0;
  const fastagFee = rtoCharge?.fastagFee ?? 600;
  const handlingCharges = rtoCharge?.handlingCharges ?? 7500;
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
    dealerBusinesses: [],
    dealers,
    dealerUsers: [],
    dealerBrandMappings,
    offers,
    heroPromotions,
  });
}

export async function calculateOnRoadPriceForApi(query: PricingQuery): Promise<PricingResult> {
  const data = await getVehicleDataSet();
  return calculateOnRoadPriceFromData(query, data);
}
