import { cache } from "react";
import { unstable_cache } from "next/cache";
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
import { deriveCompareSummary } from "@/lib/services/variant-summary";
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
  VariantCompareSummary,
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

// compare_summary defaults to '{}' in the migration, so a row that has been migrated but
// not yet backfilled arrives as an empty object rather than a well-formed summary.
// Normalising here guarantees highlights/features are always arrays — callers do
// `summary?.highlights.length`, which would throw on a bare {}.
function toCompareSummary(row: DbRow): VariantCompareSummary {
  const raw = jsonObject<Partial<VariantCompareSummary>>(row, "compare_summary", {});
  return {
    ...raw,
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    features: Array.isArray(raw.features) ? raw.features : [],
  };
}

// Seed variants are full VehicleVariants; browse fallbacks need the derived shape.
const seedBrowseVariants: BrowseVariant[] = seedVariants.map((variant) => {
  const { specifications, specificationGroups, ...rest } = variant;
  void specificationGroups;
  return { ...rest, compareSummary: variant.compareSummary ?? deriveCompareSummary(specifications) };
});

// The two spec blobs are the catalog's weight: ~2 KB/row for specification_groups and
// ~1.2 KB for specifications, against ~700 B for every other column combined. Neither is
// read by a listing or browse surface — only /on-road-price's spec table and the admin
// variant editor need them — so browse queries take the precomputed compare_summary
// (~200 B) instead. That is what takes vehicle_variants from 1.86 MB to ~0.27 MB on the
// wire, and getBrowseDataSet() from 2.19 MB to ~0.55 MB.
//
// compare_summary is derived from specifications by deriveCompareSummary() on every
// variant write; see supabase/migrations/20260820000100_variant_compare_summary.sql.
//
// mapBrowseVariant() must read exactly what BROWSE_VARIANT_COLUMNS selects — keep in sync.
export const BROWSE_VARIANT_COLUMNS =
  "id, model_id, name, slug, ex_showroom_price, fuel_type, transmission, engine_capacity, engine_cc, max_power_ps, payload_capacity_kg, mileage, seating_capacity, is_default, display_order, active, compare_summary";

// The same set as BROWSE_VARIANT_COLUMNS but pre-migration: raw specifications instead of
// the derived compare_summary. Spelled out as a literal rather than derived at runtime
// because supabase-js parses the column string at the type level. Keep in sync above.
const LEGACY_BROWSE_VARIANT_COLUMNS =
  "id, model_id, name, slug, ex_showroom_price, fuel_type, transmission, engine_capacity, engine_cc, max_power_ps, payload_capacity_kg, mileage, seating_capacity, is_default, display_order, active, specifications";

// A variant carrying the compact compare_summary in place of the two full spec blobs.
// Distinct from VehicleVariant on purpose: it makes the compiler reject any browse-surface
// code that reaches for `.specifications` or `.specificationGroups` rather than silently
// handing back the seed variant's specs or an empty array.
export type BrowseVariant = Omit<VehicleVariant, "specifications" | "specificationGroups">;

// A dataset whose variants are browse-grade. Every consumer that only prices, sorts or
// lists vehicles should accept this rather than VehicleDataSet — a full VehicleDataSet
// is assignable to it, so widening a parameter to PricingDataSet never breaks a caller,
// while keeping VehicleDataSet itself honest for the admin/detail surfaces that do read
// specificationGroups.
export type PricingDataSet = Omit<VehicleDataSet, "variants"> & { variants: BrowseVariant[] };

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

function mapBrowseVariant(row: DbRow): BrowseVariant {
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
    compareSummary: toCompareSummary(row),
    isDefault: booleanValue(row, "is_default"),
    displayOrder: numberValue(row, "display_order"),
    active: booleanValue(row, "active", true),
  };
}

function mapVariant(row: DbRow): VehicleVariant {
  return {
    ...mapBrowseVariant(row),
    specifications: jsonObject(row, "specifications", seedVariants[0]?.specifications),
    specificationGroups: jsonArray(row, "specification_groups"),
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
    verificationStatus: (row.verification_status as DealerBusiness["verificationStatus"]) ?? "pending",
    rejectionReason: optionalString(row, "rejection_reason"),
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
  variants: BrowseVariant[];
};

// Selecting compare_summary before its migration has run returns PostgREST 42703 and a
// null body, which would sink fetchBrowseDataSet() into its seed-data guard and quietly
// serve 5 seed vehicles instead of the real catalog. Rather than depend on deploy
// ordering, fall back to the pre-migration column set and derive the summary in-app —
// same output, old payload size, self-healing the moment the migration lands.
async function readBrowseVariants(): Promise<DbRow[] | undefined> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase.from("vehicle_variants").select(BROWSE_VARIANT_COLUMNS);
  if (!error && data) return data as DbRow[];

  const legacy = await supabase.from("vehicle_variants").select(LEGACY_BROWSE_VARIANT_COLUMNS);
  if (legacy.error || !legacy.data) return undefined;

  console.warn("[vehicle-data] compare_summary unavailable — deriving in-app. Run the migration + npm run backfill:compare-summary.");
  return (legacy.data as DbRow[]).map((row) => ({
    ...row,
    compare_summary: deriveCompareSummary(row.specifications as VehicleVariant["specifications"]),
  }));
}

async function fetchSlimCatalog(): Promise<SlimCatalog> {
  const supabase = createSupabaseAdminClient();

  const [brands, cities, models, variantsRes] = await Promise.all([
    readTable("brands"),
    readTable("cities"),
    readTable("vehicle_models"),
    readBrowseVariants(),
  ]);

  return {
    brands: brands?.map(mapBrand) ?? seedBrands,
    cities: cities?.map(mapCity) ?? seedCities,
    models: models?.map(mapModel) ?? seedModels,
    variants: variantsRes?.map(mapBrowseVariant) ?? seedBrowseVariants,
  };
}

// Tag every catalog-derived cache entry so a single revalidateTag(CATALOG_TAG) after an
// admin write refreshes all of them at once. See lib/services/catalog-cache.ts.
export const CATALOG_TAG = "vehicle-catalog";

// Two layers, deliberately: unstable_cache persists the result ACROSS requests (this is
// what stops every crawler hit from becoming a Supabase read), React cache() dedupes
// WITHIN one request (generateMetadata + page both calling it costs one lookup).
//
// CATALOG_TTL is only a backstop against a missed invalidation hook — correctness comes
// from revalidateCatalog() on every write. It is deliberately long: time-based expiry is
// pure cost with no benefit when tag invalidation is wired up, and at a 1-hour TTL the
// catalog + on-road-price entries alone re-fetch ~4 GB/month against a 5 GB quota.
export const CATALOG_TTL = 21600; // 6 hours
export const getSlimCatalog = cache(
  unstable_cache(fetchSlimCatalog, ["slim-catalog"], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }),
);

// Brand list only. /photos and /emi-calculator were each pulling the entire browse
// dataset to render a footer brand list; this is the same data at ~50 KB instead of 1.35 MB.
async function fetchBrandList(): Promise<Brand[]> {
  const brands = await readTable("brands");
  return brands?.map(mapBrand) ?? seedBrands;
}

export const getBrandList = cache(
  unstable_cache(fetchBrandList, ["brand-list"], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }),
);

// Pricing-grade variants: browse columns PLUS the raw specifications blob, because
// inferVehicleTaxKind() classifies a vehicle by inspecting specs.bike / specs.commercial
// and the stringified spec text. Dropping specifications here would silently change tax
// kind — and therefore the price — on any surface that prices from a catalog-wide list.
// Only /city/[slug] needs this; every other browse surface uses compare_summary.
async function fetchPricingVariants(): Promise<VehicleVariant[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return seedVariants;
  const { data } = await supabase
    .from("vehicle_variants")
    .select(`${BROWSE_VARIANT_COLUMNS}, specifications`);
  return (data as DbRow[] | null)?.map((row) => ({
    ...mapBrowseVariant(row),
    specifications: jsonObject(row, "specifications", seedVariants[0]?.specifications),
    specificationGroups: [],
  })) ?? seedVariants;
}

export const getPricingVariants = cache(
  unstable_cache(fetchPricingVariants, ["pricing-variants"], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }),
);

export type BrowseDataSet = {
  categories: VehicleCategory[];
  brands: Brand[];
  models: VehicleModel[];
  variants: BrowseVariant[];
  media: VehicleMedia[];
  cities: City[];
  heroPromotions: HeroPromotion[];
};

async function fetchBrowseDataSet(): Promise<BrowseDataSet> {
  const supabase = createSupabaseAdminClient();

  const [categories, brands, models, variantsRes, media, cities, heroPromotions] = await Promise.all([
    readTable("vehicle_categories"),
    readTable("brands"),
    readTable("vehicle_models"),
    readBrowseVariants(),
    readTable("vehicle_media"),
    readTable("cities"),
    readTable("hero_promotions"),
  ]);
  const variants = variantsRes;

  if (!brands?.length || !models?.length || !variants?.length || !cities?.length) {
    return {
      categories: seedCategories,
      brands: seedBrands,
      models: seedModels,
      variants: seedBrowseVariants,
      media: seedVehicleMedia,
      cities: seedCities,
      heroPromotions: seedHeroPromotions,
    };
  }

  return {
    categories: categories?.map(mapCategory) ?? seedCategories,
    brands: brands.map(mapBrand),
    models: models.map(mapModel),
    variants: variants.map(mapBrowseVariant),
    media: media?.map(mapMedia) ?? [],
    cities: cities.map(mapCity),
    heroPromotions: heroPromotions?.map(mapHeroPromotion) ?? seedHeroPromotions,
  };
}

// Narrower than getVehicleDataSet — only the 7 tables browse/listing pages actually
// touch (categories, brands, models, variants, media, cities, heroPromotions). Used by
// homepage, /discover, and /brands/[brand] to avoid pulling all 20 tables per pageview.
export const getBrowseDataSet = cache(
  unstable_cache(fetchBrowseDataSet, ["browse-data-set"], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }),
);
