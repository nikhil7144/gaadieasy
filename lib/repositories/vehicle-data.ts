import { cache } from "react";
import {
  brands as seedBrands,
  categories as seedCategories,
  cityPages as seedCityPages,
  cities as seedCities,
  dealerBrandMappings as seedDealerBrandMappings,
  dealers as seedDealers,
  gstRules as seedGstRules,
  heroPromotions as seedHeroPromotions,
  insuranceRules as seedInsuranceRules,
  models as seedModels,
  offers as seedOffers,
  registrationFeeRules as seedRegistrationFeeRules,
  rtoCharges as seedRtoCharges,
  rtoOffices as seedRtoOffices,
  states as seedStates,
  taxRules as seedTaxRules,
  variants as seedVariants,
  vehicleMedia as seedVehicleMedia,
} from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Brand,
  City,
  CityPage,
  Dealer,
  DealerBusiness,
  DealerBrandMapping,
  DealerUser,
  GstRule,
  InsuranceRule,
  Offer,
  HeroPromotion,
  RegistrationFeeRule,
  RtoCharge,
  RtoOffice,
  State,
  StateTaxRule,
  VehicleCategory,
  VehicleMedia,
  VehicleModel,
  VehicleVariant,
} from "@/types/automobile";

export type VehicleDataSet = {
  categories: VehicleCategory[];
  brands: Brand[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  media: VehicleMedia[];
  states: State[];
  cities: City[];
  rtoOffices: RtoOffice[];
  taxRules: StateTaxRule[];
  rtoCharges: RtoCharge[];
  insuranceRules: InsuranceRule[];
  gstRules: GstRule[];
  registrationFeeRules: RegistrationFeeRule[];
  dealerBusinesses: DealerBusiness[];
  dealers: Dealer[];
  dealerUsers: DealerUser[];
  dealerBrandMappings: DealerBrandMapping[];
  offers: Offer[];
  heroPromotions: HeroPromotion[];
  cityPages: CityPage[];
};

type DbRow = Record<string, unknown>;

const seedDataSet: VehicleDataSet = {
  categories: seedCategories,
  brands: seedBrands,
  models: seedModels,
  variants: seedVariants,
  media: seedVehicleMedia,
  states: seedStates,
  cities: seedCities,
  rtoOffices: seedRtoOffices,
  taxRules: seedTaxRules,
  rtoCharges: seedRtoCharges,
  insuranceRules: seedInsuranceRules,
  gstRules: seedGstRules,
  registrationFeeRules: seedRegistrationFeeRules,
  dealerBusinesses: [],
  dealers: seedDealers,
  dealerUsers: [],
  dealerBrandMappings: seedDealerBrandMappings,
  offers: seedOffers,
  heroPromotions: seedHeroPromotions,
  cityPages: seedCityPages,
};

function stringValue(row: DbRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function optionalString(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function numberValue(row: DbRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

function optionalNumber(row: DbRow, key: string) {
  const value = row[key];
  if (value === null || value === undefined || value === "") return undefined;
  return typeof value === "number" ? value : Number(value);
}

function booleanValue(row: DbRow, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function jsonArray<T>(row: DbRow, key: string, fallback: T[] = []) {
  const value = row[key];
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function jsonObject<T>(row: DbRow, key: string, fallback: T) {
  const value = row[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : fallback;
}

async function readTable(table: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase.from(table).select("*");
  if (error || !data) return undefined;
  return data as DbRow[];
}

function mapCategory(row: DbRow): VehicleCategory {
  return {
    id: stringValue(row, "id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    description: stringValue(row, "description"),
  };
}

function mapBrand(row: DbRow): Brand {
  return {
    id: stringValue(row, "id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    logoUrl: optionalString(row, "logo_url"),
    categoryIds: jsonArray<string>(row, "category_ids"),
    active: booleanValue(row, "active", true),
    featured: booleanValue(row, "featured"),
    overview: optionalString(row, "overview"),
    tagline: optionalString(row, "tagline"),
    seoTitle: optionalString(row, "seo_title"),
    seoDescription: optionalString(row, "seo_description"),
  };
}

function mapModel(row: DbRow): VehicleModel {
  return {
    id: stringValue(row, "id"),
    brandId: stringValue(row, "brand_id"),
    categoryId: stringValue(row, "category_id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    bodyType: stringValue(row, "body_type"),
    loaderSize: optionalString(row, "loader_size") as VehicleModel["loaderSize"],
    noOfWheels: optionalNumber(row, "no_of_wheels"),
    tags: jsonArray<string>(row, "tags"),
    imageUrl: stringValue(row, "image_url"),
    launchLabel: optionalString(row, "launch_label"),
    overview: optionalString(row, "overview"),
    pros: jsonArray<string>(row, "pros"),
    cons: jsonArray<string>(row, "cons"),
    faq: jsonArray<{ question: string; answer: string }>(row, "faq"),
    active: booleanValue(row, "active", true),
    featured: booleanValue(row, "featured"),
    isUpcoming: booleanValue(row, "is_upcoming"),
  };
}

function mapHeroPromotion(row: DbRow): HeroPromotion {
  return {
    id: stringValue(row, "id"),
    placement: stringValue(row, "placement", "homepage_hero") as HeroPromotion["placement"],
    eyebrow: optionalString(row, "eyebrow"),
    headline: optionalString(row, "headline"),
    supportingCopy: optionalString(row, "supporting_copy"),
    title: stringValue(row, "title"),
    subtitle: optionalString(row, "subtitle"),
    ctaLabel: optionalString(row, "cta_label"),
    stat1Label: optionalString(row, "stat_1_label"),
    stat1Value: optionalString(row, "stat_1_value"),
    stat2Label: optionalString(row, "stat_2_label"),
    stat2Value: optionalString(row, "stat_2_value"),
    stat3Label: optionalString(row, "stat_3_label"),
    stat3Value: optionalString(row, "stat_3_value"),
    imageUrl: stringValue(row, "image_url"),
    categoryKey: stringValue(row, "category_key", "cars") as HeroPromotion["categoryKey"],
    brandId: optionalString(row, "brand_id"),
    modelId: optionalString(row, "model_id"),
    variantId: optionalString(row, "variant_id"),
    targetUrl: stringValue(row, "target_url"),
    active: booleanValue(row, "active", true),
  };
}

function mapVariant(row: DbRow): VehicleVariant {
  return {
    id: stringValue(row, "id"),
    modelId: stringValue(row, "model_id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    exShowroomPrice: numberValue(row, "ex_showroom_price"),
    fuelType: stringValue(row, "fuel_type") as VehicleVariant["fuelType"],
    transmission: stringValue(row, "transmission") as VehicleVariant["transmission"],
    engineCapacity: stringValue(row, "engine_capacity"),
    engineCc: optionalNumber(row, "engine_cc"),
    maxPowerPs: optionalNumber(row, "max_power_ps"),
    payloadCapacityKg: optionalNumber(row, "payload_capacity_kg"),
    mileage: stringValue(row, "mileage"),
    seatingCapacity: numberValue(row, "seating_capacity"),
    specifications: jsonObject(row, "specifications", seedVariants[0]?.specifications),
    specificationGroups: jsonArray(row, "specification_groups"),
    isDefault: booleanValue(row, "is_default"),
    displayOrder: numberValue(row, "display_order"),
    active: booleanValue(row, "active", true),
  };
}

function mapMedia(row: DbRow): VehicleMedia {
  return {
    id: stringValue(row, "id"),
    modelId: stringValue(row, "model_id"),
    variantId: optionalString(row, "variant_id"),
    colorName: optionalString(row, "color_name"),
    url: stringValue(row, "url"),
    alt: stringValue(row, "alt"),
    mediaType: stringValue(row, "media_type", "exterior") as VehicleMedia["mediaType"],
    displayOrder: numberValue(row, "display_order"),
    active: booleanValue(row, "active", true),
  };
}

export function mapState(row: DbRow): State {
  return { id: stringValue(row, "id"), name: stringValue(row, "name"), code: stringValue(row, "code") };
}

function mapCity(row: DbRow): City {
  return {
    id: stringValue(row, "id"),
    stateId: stringValue(row, "state_id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    defaultRtoId: stringValue(row, "default_rto_id"),
    tier: optionalString(row, "tier"),
    isMetro: booleanValue(row, "is_metro"),
    rtoStateCode: optionalString(row, "rto_state_code"),
  };
}

export function mapCityPage(row: DbRow): CityPage {
  return {
    id: stringValue(row, "id"),
    cityId: stringValue(row, "city_id"),
    slug: stringValue(row, "slug"),
    title: stringValue(row, "title"),
    h1: stringValue(row, "h1"),
    metaTitle: stringValue(row, "meta_title"),
    metaDescription: stringValue(row, "meta_description"),
    intro: stringValue(row, "intro"),
    body: stringValue(row, "body"),
    heroImageUrl: optionalString(row, "hero_image_url"),
    featuredCategoryId: optionalString(row, "featured_category_id"),
    featuredBrandIds: jsonArray<string>(row, "featured_brand_ids"),
    faq: jsonArray(row, "faq"),
    showInFooter: booleanValue(row, "show_in_footer", true),
    displayOrder: numberValue(row, "display_order"),
    active: booleanValue(row, "active", true),
    createdAt: optionalString(row, "created_at"),
    updatedAt: optionalString(row, "updated_at"),
  };
}

export function mapRtoOffice(row: DbRow): RtoOffice {
  return {
    id: stringValue(row, "id"),
    stateId: stringValue(row, "state_id"),
    cityId: stringValue(row, "city_id"),
    code: stringValue(row, "code"),
    name: stringValue(row, "name"),
  };
}

export function mapTaxRule(row: DbRow): StateTaxRule {
  return {
    id: stringValue(row, "id"),
    stateId: stringValue(row, "state_id"),
    categoryId: stringValue(row, "category_id"),
    fuelType: optionalString(row, "fuel_type") as StateTaxRule["fuelType"],
    minPrice: numberValue(row, "min_price"),
    maxPrice: optionalNumber(row, "max_price"),
    roadTaxPercent: numberValue(row, "road_tax_percent"),
    fixedTaxAmount: numberValue(row, "fixed_tax_amount"),
    evExemptionPercent: numberValue(row, "ev_exemption_percent"),
    luxuryCessPercent: numberValue(row, "luxury_cess_percent"),
    active: booleanValue(row, "active", true),
  };
}

export function mapRtoCharge(row: DbRow): RtoCharge {
  return {
    id: stringValue(row, "id"),
    stateId: stringValue(row, "state_id"),
    cityId: stringValue(row, "city_id"),
    rtoId: stringValue(row, "rto_id"),
    registrationFee: numberValue(row, "registration_fee"),
    smartCardFee: numberValue(row, "smart_card_fee"),
    numberPlateFee: numberValue(row, "number_plate_fee"),
    hypothecationFee: numberValue(row, "hypothecation_fee"),
    fastagFee: numberValue(row, "fastag_fee"),
    handlingCharges: numberValue(row, "handling_charges"),
    active: booleanValue(row, "active", true),
  };
}

export function mapInsuranceRule(row: DbRow): InsuranceRule {
  return {
    id: stringValue(row, "id"),
    categoryId: stringValue(row, "category_id"),
    fuelType: optionalString(row, "fuel_type") as InsuranceRule["fuelType"],
    percentOfExShowroom: numberValue(row, "percent_of_ex_showroom"),
    fixedAmount: numberValue(row, "fixed_amount"),
    active: booleanValue(row, "active", true),
  };
}

export function mapGstRule(row: DbRow): GstRule {
  return {
    id: stringValue(row, "id"),
    vehicleClass: stringValue(row, "vehicle_class") as GstRule["vehicleClass"],
    gstPercent: numberValue(row, "gst_percent"),
    active: booleanValue(row, "active", true),
  };
}

export function mapRegistrationFeeRule(row: DbRow): RegistrationFeeRule {
  return {
    id: stringValue(row, "id"),
    vehicleClass: stringValue(row, "vehicle_class") as RegistrationFeeRule["vehicleClass"],
    registrationFee: numberValue(row, "registration_fee"),
    smartCardFee: numberValue(row, "smart_card_fee"),
    numberPlateFee: numberValue(row, "number_plate_fee"),
    hypothecationFee: numberValue(row, "hypothecation_fee"),
    fastagFee: numberValue(row, "fastag_fee"),
    handlingCharges: numberValue(row, "handling_charges"),
    active: booleanValue(row, "active", true),
  };
}

export function mapDealer(row: DbRow): Dealer {
  return {
    id: stringValue(row, "id"),
    dealerBusinessId: optionalString(row, "dealer_business_id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    logoUrl: optionalString(row, "logo_url"),
    cityId: stringValue(row, "city_id"),
    area: stringValue(row, "area"),
    contactPerson: stringValue(row, "contact_person"),
    phone: stringValue(row, "phone"),
    email: stringValue(row, "email"),
    gstNumber: optionalString(row, "gst_number"),
    active: booleanValue(row, "active", true),
    verified: booleanValue(row, "verified"),
    priority: numberValue(row, "priority"),
  };
}

function mapDealerBusiness(row: DbRow): DealerBusiness {
  return {
    id: stringValue(row, "id"),
    name: stringValue(row, "name"),
    slug: stringValue(row, "slug"),
    logoUrl: optionalString(row, "logo_url"),
    phone: optionalString(row, "phone"),
    email: optionalString(row, "email"),
    active: booleanValue(row, "active", true),
    verified: booleanValue(row, "verified"),
    createdAt: optionalString(row, "created_at"),
  };
}

function mapDealerUser(row: DbRow): DealerUser {
  return {
    id: stringValue(row, "id"),
    userId: stringValue(row, "user_id"),
    dealerBusinessId: stringValue(row, "dealer_business_id"),
    dealerId: optionalString(row, "dealer_id"),
    role: stringValue(row, "role", "dealer_showroom_user") as DealerUser["role"],
    active: booleanValue(row, "active", true),
    createdAt: optionalString(row, "created_at"),
  };
}

export function mapDealerBrandMapping(row: DbRow): DealerBrandMapping {
  return {
    id: stringValue(row, "id"),
    dealerId: stringValue(row, "dealer_id"),
    brandId: stringValue(row, "brand_id"),
    cityId: stringValue(row, "city_id"),
    active: booleanValue(row, "active", true),
  };
}

export function mapOffer(row: DbRow): Offer {
  return {
    id: stringValue(row, "id"),
    title: stringValue(row, "title"),
    description: optionalString(row, "description"),
    dealerBusinessId: optionalString(row, "dealer_business_id"),
    dealerId: optionalString(row, "dealer_id"),
    brandId: optionalString(row, "brand_id"),
    modelId: optionalString(row, "model_id"),
    cityId: optionalString(row, "city_id"),
    discountAmount: numberValue(row, "discount_amount"),
    sponsorType: stringValue(row, "sponsor_type", "dealer") as Offer["sponsorType"],
    placement: stringValue(row, "placement", "dealer_card") as Offer["placement"],
    approvalStatus: stringValue(row, "approval_status", "approved") as Offer["approvalStatus"],
    createdByDealerUserId: optionalString(row, "created_by_dealer_user_id"),
    startDate: optionalString(row, "start_date"),
    endDate: optionalString(row, "end_date"),
    active: booleanValue(row, "active", true),
    createdAt: optionalString(row, "created_at"),
  };
}

async function fetchVehicleDataSet(): Promise<VehicleDataSet> {
  const [
    categories,
    brands,
    models,
    variants,
    media,
    states,
    cities,
    rtoOffices,
    taxRules,
    rtoCharges,
    insuranceRules,
    gstRules,
    registrationFeeRules,
    dealerBusinesses,
    dealers,
    dealerUsers,
    dealerBrandMappings,
    offers,
    heroPromotions,
    cityPages,
  ] = await Promise.all([
    readTable("vehicle_categories"),
    readTable("brands"),
    readTable("vehicle_models"),
    readTable("vehicle_variants"),
    readTable("vehicle_media"),
    readTable("states"),
    readTable("cities"),
    readTable("rto_offices"),
    readTable("state_tax_rules"),
    readTable("rto_charges"),
    readTable("insurance_rules"),
    readTable("gst_rules"),
    readTable("registration_fee_rules"),
    readTable("dealer_businesses"),
    readTable("dealers"),
    readTable("dealer_users"),
    readTable("dealer_brand_mappings"),
    readTable("offers"),
    readTable("hero_promotions"),
    readTable("city_pages"),
  ]);

  if (!brands?.length || !models?.length || !variants?.length || !cities?.length) {
    return seedDataSet;
  }

  return {
    categories: categories?.map(mapCategory) ?? seedCategories,
    brands: brands.map(mapBrand),
    models: models.map(mapModel),
    variants: variants.map(mapVariant),
    media: media?.map(mapMedia) ?? [],
    states: states?.map(mapState) ?? seedStates,
    cities: cities.map(mapCity),
    rtoOffices: rtoOffices?.map(mapRtoOffice) ?? seedRtoOffices,
    taxRules: taxRules?.map(mapTaxRule) ?? [],
    rtoCharges: rtoCharges?.map(mapRtoCharge) ?? [],
    insuranceRules: insuranceRules?.map(mapInsuranceRule) ?? [],
    gstRules: gstRules?.map(mapGstRule) ?? seedGstRules,
    registrationFeeRules: registrationFeeRules?.map(mapRegistrationFeeRule) ?? seedRegistrationFeeRules,
    dealerBusinesses: dealerBusinesses?.map(mapDealerBusiness) ?? [],
    dealers: dealers?.map(mapDealer) ?? [],
    dealerUsers: dealerUsers?.map(mapDealerUser) ?? [],
    dealerBrandMappings: dealerBrandMappings?.map(mapDealerBrandMapping) ?? [],
    offers: offers?.map(mapOffer) ?? [],
    heroPromotions: heroPromotions?.map(mapHeroPromotion) ?? seedHeroPromotions,
    cityPages: cityPages?.map(mapCityPage) ?? seedCityPages,
  };
}

// React cache() deduplicates within a single request — if generateMetadata and
// the page component both call getVehicleDataSet(), Supabase is only hit once.
// No 2MB size limit, no silent failure.
export const getVehicleDataSet = cache(fetchVehicleDataSet);

export type SlimCatalog = {
  brands: Brand[];
  cities: City[];
  models: VehicleModel[];
  variants: VehicleVariant[];
};

async function fetchSlimCatalog(): Promise<SlimCatalog> {
  const supabase = createSupabaseAdminClient();

  const [brands, cities, models, variantsRes] = await Promise.all([
    readTable("brands"),
    readTable("cities"),
    readTable("vehicle_models"),
    // Exclude specifications + specification_groups — large JSON columns not needed for listings
    supabase
      ? supabase.from("vehicle_variants").select(
          "id, model_id, name, slug, ex_showroom_price, fuel_type, transmission, engine_capacity, engine_cc, max_power_ps, payload_capacity_kg, mileage, seating_capacity, is_default, display_order, active",
        )
      : Promise.resolve({ data: null }),
  ]);

  return {
    brands: brands?.map(mapBrand) ?? seedBrands,
    cities: cities?.map(mapCity) ?? seedCities,
    models: models?.map(mapModel) ?? seedModels,
    variants: (variantsRes.data as DbRow[] | null)?.map(mapVariant) ?? seedVariants,
  };
}

export const getSlimCatalog = cache(fetchSlimCatalog);

export type BrowseDataSet = {
  categories: VehicleCategory[];
  brands: Brand[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  media: VehicleMedia[];
  cities: City[];
  heroPromotions: HeroPromotion[];
};

async function fetchBrowseDataSet(): Promise<BrowseDataSet> {
  const [categories, brands, models, variants, media, cities, heroPromotions] = await Promise.all([
    readTable("vehicle_categories"),
    readTable("brands"),
    readTable("vehicle_models"),
    readTable("vehicle_variants"),
    readTable("vehicle_media"),
    readTable("cities"),
    readTable("hero_promotions"),
  ]);

  if (!brands?.length || !models?.length || !variants?.length || !cities?.length) {
    return {
      categories: seedCategories,
      brands: seedBrands,
      models: seedModels,
      variants: seedVariants,
      media: seedVehicleMedia,
      cities: seedCities,
      heroPromotions: seedHeroPromotions,
    };
  }

  return {
    categories: categories?.map(mapCategory) ?? seedCategories,
    brands: brands.map(mapBrand),
    models: models.map(mapModel),
    variants: variants.map(mapVariant),
    media: media?.map(mapMedia) ?? [],
    cities: cities.map(mapCity),
    heroPromotions: heroPromotions?.map(mapHeroPromotion) ?? seedHeroPromotions,
  };
}

// Narrower than getVehicleDataSet — only the 7 tables browse/listing pages actually
// touch (categories, brands, models, variants, media, cities, heroPromotions). Used by
// homepage, /discover, and /brands/[brand] to avoid pulling all 20 tables per pageview.
export const getBrowseDataSet = cache(fetchBrowseDataSet);
