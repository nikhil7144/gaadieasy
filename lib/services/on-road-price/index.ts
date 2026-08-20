import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { BROWSE_VARIANT_COLUMNS, CATALOG_TAG, getVehicleDataSet, type BrowseVariant, type VehicleDataSet } from "@/lib/repositories/vehicle-data";
import { batchCalculateWithCache, calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import { batchGetCachedPricing, getCachedPricing, setCachedPricing } from "@/lib/services/pricing-cache";
import type {
  Brand,
  City,
  Dealer,
  GstRule,
  InsuranceRule,
  Offer,
  PriceBreakdown,
  RegistrationFeeRule,
  RtoCharge,
  RtoOffice,
  State,
  StateTaxRule,
  VehicleCategory,
  VehicleModel,
  VehicleVariant,
} from "@/types/automobile";

// ── Public types ──────────────────────────────────────────────────────────────

export type OnRoadPageData = {
  brand: Brand;
  model: VehicleModel;
  variant: VehicleVariant;
  city: City;
  state: State;
  rto?: RtoOffice;
  dealer?: Dealer;
  offer?: Offer;
  dealerOffers: Offer[];
  breakdown: PriceBreakdown;
  modelVariants: BrowseVariant[];
  variantPrices: Array<{ variant: BrowseVariant; breakdown: PriceBreakdown }>;
};

// ── Row helpers ───────────────────────────────────────────────────────────────

type R = Record<string, unknown>;

const str = (r: R, k: string, fb = "") => { const v = r[k]; return typeof v === "string" ? v : fb; };
const ostr = (r: R, k: string) => { const v = r[k]; return typeof v === "string" && v ? v : undefined; };
const num = (r: R, k: string, fb = 0) => { const v = r[k]; return typeof v === "number" ? v : Number(v ?? fb); };
const onum = (r: R, k: string) => { const v = r[k]; if (v == null || v === "") return undefined; return typeof v === "number" ? v : Number(v); };
const bol = (r: R, k: string, fb = false) => { const v = r[k]; return typeof v === "boolean" ? v : fb; };
const arr = <T>(r: R, k: string): T[] => { const v = r[k]; return Array.isArray(v) ? (v as T[]) : []; };
const obj = <T>(r: R, k: string, fb: T): T => { const v = r[k]; return (v && typeof v === "object" && !Array.isArray(v)) ? (v as T) : fb; };

function toVariant(r: R): VehicleVariant {
  return {
    id: str(r, "id"), modelId: str(r, "model_id"), name: str(r, "name"), slug: str(r, "slug"),
    exShowroomPrice: num(r, "ex_showroom_price"), fuelType: str(r, "fuel_type") as VehicleVariant["fuelType"],
    transmission: str(r, "transmission") as VehicleVariant["transmission"], engineCapacity: str(r, "engine_capacity"),
    engineCc: onum(r, "engine_cc"), maxPowerPs: onum(r, "max_power_ps"), payloadCapacityKg: onum(r, "payload_capacity_kg"),
    mileage: str(r, "mileage"), seatingCapacity: num(r, "seating_capacity"),
    specifications: obj(r, "specifications", {} as VehicleVariant["specifications"]), specificationGroups: arr(r, "specification_groups"),
    isDefault: bol(r, "is_default"), displayOrder: num(r, "display_order"), active: bol(r, "active", true),
  };
}

function toModel(r: R): VehicleModel {
  return {
    id: str(r, "id"), brandId: str(r, "brand_id"), categoryId: str(r, "category_id"),
    name: str(r, "name"), slug: str(r, "slug"), bodyType: str(r, "body_type"),
    loaderSize: ostr(r, "loader_size") as VehicleModel["loaderSize"], noOfWheels: onum(r, "no_of_wheels"),
    tags: arr<string>(r, "tags"), imageUrl: str(r, "image_url"), launchLabel: ostr(r, "launch_label"),
    overview: ostr(r, "overview"), pros: arr<string>(r, "pros"), cons: arr<string>(r, "cons"),
    faq: arr<{ question: string; answer: string }>(r, "faq"),
    active: bol(r, "active", true), featured: bol(r, "featured"), isUpcoming: bol(r, "is_upcoming"),
  };
}

function toBrand(r: R): Brand {
  return {
    id: str(r, "id"), name: str(r, "name"), slug: str(r, "slug"), logoUrl: ostr(r, "logo_url"),
    categoryIds: arr<string>(r, "category_ids"), active: bol(r, "active", true), featured: bol(r, "featured"),
    overview: ostr(r, "overview"), tagline: ostr(r, "tagline"), seoTitle: ostr(r, "seo_title"), seoDescription: ostr(r, "seo_description"),
  };
}

function toCity(r: R): City {
  return {
    id: str(r, "id"), stateId: str(r, "state_id"), name: str(r, "name"), slug: str(r, "slug"),
    defaultRtoId: str(r, "default_rto_id"), tier: ostr(r, "tier"),
    isMetro: bol(r, "is_metro"), rtoStateCode: ostr(r, "rto_state_code"),
  };
}

function toState(r: R): State {
  return { id: str(r, "id"), name: str(r, "name"), code: str(r, "code") };
}

function toRto(r: R): RtoOffice {
  return { id: str(r, "id"), stateId: str(r, "state_id"), cityId: str(r, "city_id"), code: str(r, "code"), name: str(r, "name") };
}

function toDealer(r: R): Dealer {
  return {
    id: str(r, "id"), dealerBusinessId: ostr(r, "dealer_business_id"), name: str(r, "name"), slug: str(r, "slug"),
    logoUrl: ostr(r, "logo_url"), cityId: str(r, "city_id"), area: str(r, "area"),
    contactPerson: str(r, "contact_person"), phone: str(r, "phone"), email: str(r, "email"),
    gstNumber: ostr(r, "gst_number"), active: bol(r, "active", true), verified: bol(r, "verified"), priority: num(r, "priority"),
  };
}

function toCategory(r: R): VehicleCategory {
  return { id: str(r, "id"), name: str(r, "name"), slug: str(r, "slug"), description: str(r, "description") };
}

function toTaxRule(r: R): StateTaxRule {
  return {
    id: str(r, "id"), stateId: str(r, "state_id"), categoryId: str(r, "category_id"),
    fuelType: ostr(r, "fuel_type") as StateTaxRule["fuelType"],
    minPrice: num(r, "min_price"), maxPrice: onum(r, "max_price"),
    roadTaxPercent: num(r, "road_tax_percent"), fixedTaxAmount: num(r, "fixed_tax_amount"),
    evExemptionPercent: num(r, "ev_exemption_percent"), luxuryCessPercent: num(r, "luxury_cess_percent"),
    active: bol(r, "active", true),
  };
}

function toRtoCharge(r: R): RtoCharge {
  return {
    id: str(r, "id"), stateId: str(r, "state_id"), cityId: str(r, "city_id"), rtoId: str(r, "rto_id"),
    registrationFee: num(r, "registration_fee"), smartCardFee: num(r, "smart_card_fee"),
    numberPlateFee: num(r, "number_plate_fee"), hypothecationFee: num(r, "hypothecation_fee"),
    fastagFee: num(r, "fastag_fee"), handlingCharges: num(r, "handling_charges"), active: bol(r, "active", true),
  };
}

function toInsuranceRule(r: R): InsuranceRule {
  return {
    id: str(r, "id"), categoryId: str(r, "category_id"), fuelType: ostr(r, "fuel_type") as InsuranceRule["fuelType"],
    percentOfExShowroom: num(r, "percent_of_ex_showroom"), fixedAmount: num(r, "fixed_amount"), active: bol(r, "active", true),
  };
}

function toGstRule(r: R): GstRule {
  return { id: str(r, "id"), vehicleClass: str(r, "vehicle_class") as GstRule["vehicleClass"], gstPercent: num(r, "gst_percent"), active: bol(r, "active", true) };
}

function toRegistrationFeeRule(r: R): RegistrationFeeRule {
  return {
    id: str(r, "id"), vehicleClass: str(r, "vehicle_class") as RegistrationFeeRule["vehicleClass"],
    registrationFee: num(r, "registration_fee"), smartCardFee: num(r, "smart_card_fee"),
    numberPlateFee: num(r, "number_plate_fee"), hypothecationFee: num(r, "hypothecation_fee"),
    fastagFee: num(r, "fastag_fee"), handlingCharges: num(r, "handling_charges"), active: bol(r, "active", true),
  };
}

function toOffer(r: R): Offer {
  return {
    id: str(r, "id"), title: str(r, "title"), description: ostr(r, "description"),
    dealerBusinessId: ostr(r, "dealer_business_id"), dealerId: ostr(r, "dealer_id"),
    brandId: ostr(r, "brand_id"), modelId: ostr(r, "model_id"), cityId: ostr(r, "city_id"),
    discountAmount: num(r, "discount_amount"), sponsorType: str(r, "sponsor_type", "dealer") as Offer["sponsorType"],
    placement: str(r, "placement", "dealer_card") as Offer["placement"],
    approvalStatus: str(r, "approval_status", "approved") as Offer["approvalStatus"],
    createdByDealerUserId: ostr(r, "created_by_dealer_user_id"),
    startDate: ostr(r, "start_date"), endDate: ostr(r, "end_date"),
    active: bol(r, "active", true), createdAt: ostr(r, "created_at"),
  };
}

function emptyBreakdown(exShowroomPrice: number): PriceBreakdown {
  return {
    exShowroomPrice, roadTax: 0, registrationFee: 0, insurance: 0, smartCardFee: 0,
    numberPlateFee: 0, hypothecationFee: 0, fastagFee: 0, handlingCharges: 0,
    offerDiscount: 0, totalOnRoadPrice: exShowroomPrice,
  };
}

// ── Tier 1: Targeted fetch helpers ────────────────────────────────────────────

type Supa = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function resolveVariantAndCity(supabase: Supa, variantSlug: string, citySlug: string, modelSlug?: string) {
  // Round 1: resolve model (to constrain variant lookup) + city in parallel
  const [modelRes, cityRes] = await Promise.all([
    modelSlug
      ? supabase.from("vehicle_models").select("*").ilike("slug", decodeURIComponent(modelSlug).trim()).eq("active", true).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("cities").select("*").ilike("slug", decodeURIComponent(citySlug).trim()).limit(1).maybeSingle(),
  ]);
  if (!cityRes.data) return null;
  const city = toCity(cityRes.data as R);

  // Round 2: variant constrained by model_id (prevents slug collisions across models) + state in parallel
  let variantQuery = supabase.from("vehicle_variants").select("*").ilike("slug", decodeURIComponent(variantSlug).trim()).eq("active", true);
  if (modelRes.data) variantQuery = variantQuery.eq("model_id", String((modelRes.data as R).id));

  const [variantRes, stateRes] = await Promise.all([
    variantQuery.limit(1).maybeSingle(),
    supabase.from("states").select("*").eq("id", city.stateId).limit(1).maybeSingle(),
  ]);
  if (!variantRes.data || !stateRes.data) return null;

  const variant = toVariant(variantRes.data as R);
  const state = toState(stateRes.data as R);

  // Use already-fetched model or fall back to fetching by variant.modelId
  let model: VehicleModel;
  if (modelRes.data) {
    model = toModel(modelRes.data as R);
  } else {
    const { data: mData } = await supabase.from("vehicle_models").select("*").eq("id", variant.modelId).limit(1).maybeSingle();
    if (!mData) return null;
    model = toModel(mData as R);
  }

  const brandRes = await supabase.from("brands").select("*").eq("id", model.brandId).limit(1).maybeSingle();
  if (!brandRes.data) return null;
  const brand = toBrand(brandRes.data as R);

  return { variant, model, brand, city, state };
}

async function fetchRto(supabase: Supa, cityId: string, defaultRtoId: string) {
  const { data } = await supabase
    .from("rto_offices")
    .select("*")
    .or(`id.eq.${defaultRtoId},city_id.eq.${cityId}`)
    .limit(1)
    .maybeSingle();
  return data ? toRto(data as R) : undefined;
}

// The variants price table renders id/name/slug/fuelType/transmission plus a count —
// never specifications or specification_groups. select("*") here was 12.3 KB of a
// 22.9 KB Tier-1 request; the slim column list makes it 1.3 KB.
async function fetchSiblings(supabase: Supa, modelId: string) {
  const { data } = await supabase
    .from("vehicle_variants")
    .select(BROWSE_VARIANT_COLUMNS)
    .eq("model_id", modelId)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("ex_showroom_price", { ascending: true });
  return (data ?? []).map((r) => toVariant(r as R));
}

async function fetchDealer(supabase: Supa, brandId: string, cityId: string): Promise<Dealer | undefined> {
  const { data: mappings } = await supabase
    .from("dealer_brand_mappings")
    .select("dealer_id")
    .eq("brand_id", brandId)
    .eq("city_id", cityId)
    .eq("active", true);

  const dealerIds = (mappings ?? []).map((m) => String((m as R).dealer_id)).filter(Boolean);
  if (!dealerIds.length) return undefined;

  const { data: dealers } = await supabase
    .from("dealers")
    .select("*")
    .in("id", dealerIds)
    .eq("active", true)
    .eq("verified", true)
    .order("priority", { ascending: false })
    .limit(1);

  return dealers?.[0] ? toDealer(dealers[0] as R) : undefined;
}

async function fetchOffers(supabase: Supa, brandId: string, modelId: string, cityId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await supabase
    .from("offers")
    .select("*")
    .eq("active", true)
    .or(`brand_id.is.null,brand_id.eq.${brandId}`)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`);

  const all = (rows ?? [])
    .map((r) => toOffer(r as R))
    .filter(
      (o) =>
        (o.approvalStatus ?? "approved") === "approved" &&
        (!o.modelId || o.modelId === modelId) &&
        (!o.cityId || o.cityId === cityId),
    );

  const offer = all.find((o) => o.placement !== "dealer_card");
  const dealerOffers = all.filter((o) => o.placement === "dealer_card");
  return { offer, dealerOffers };
}

// ── Tier 1: Minimal dataset for cache-miss ────────────────────────────────────

async function fetchMinimalPricingTables(supabase: Supa, categoryId: string, stateId: string, cityId: string) {
  const [categoryRes, taxRes, rtoChargeRes, insuranceRes, gstRes, regFeeRes] = await Promise.all([
    supabase.from("vehicle_categories").select("*").eq("id", categoryId).limit(1).maybeSingle(),
    supabase.from("state_tax_rules").select("*").eq("state_id", stateId),
    supabase.from("rto_charges").select("*").eq("city_id", cityId),
    supabase.from("insurance_rules").select("*").eq("category_id", categoryId),
    supabase.from("gst_rules").select("*"),
    supabase.from("registration_fee_rules").select("*"),
  ]);

  return {
    category: categoryRes.data ? toCategory(categoryRes.data as R) : undefined,
    taxRules: (taxRes.data ?? []).map((r) => toTaxRule(r as R)),
    rtoCharges: (rtoChargeRes.data ?? []).map((r) => toRtoCharge(r as R)),
    insuranceRules: (insuranceRes.data ?? []).map((r) => toInsuranceRule(r as R)),
    gstRules: (gstRes.data ?? []).map((r) => toGstRule(r as R)),
    registrationFeeRules: (regFeeRes.data ?? []).map((r) => toRegistrationFeeRule(r as R)),
  };
}

async function computeMinimalPricing(
  supabase: Supa,
  ctx: {
    variant: VehicleVariant; model: VehicleModel; brand: Brand; city: City; state: State;
    rto?: RtoOffice; dealer?: Dealer; offersData: { offer?: Offer; dealerOffers: Offer[] }; siblings: VehicleVariant[];
  },
  params: { brand?: string; model?: string; variant?: string; city?: string },
): Promise<OnRoadPageData> {
  const { variant, model, brand, city, state, rto, dealer, offersData, siblings } = ctx;

  const tables = await fetchMinimalPricingTables(supabase, model.categoryId, state.id, city.id);
  if (!tables.category) return tier2(params); // data integrity issue — bail to full fetch rather than mis-price

  const data: VehicleDataSet = {
    categories: [tables.category],
    brands: [brand],
    models: [model],
    variants: siblings,
    media: [],
    states: [state],
    cities: [city],
    rtoOffices: rto ? [rto] : [],
    taxRules: tables.taxRules,
    rtoCharges: tables.rtoCharges,
    insuranceRules: tables.insuranceRules,
    gstRules: tables.gstRules,
    registrationFeeRules: tables.registrationFeeRules,
    dealerBusinesses: [],
    dealers: [],
    dealerUsers: [],
    dealerBrandMappings: [],
    offers: [],
    heroPromotions: [],
    cityPages: [],
  };

  const pricing = calculateOnRoadPriceFromData(
    { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
    data,
  );
  setCachedPricing(variant.id, city.id, pricing.breakdown).catch(() => {});

  const variantPricesRaw = await batchCalculateWithCache(
    siblings.map((v) => ({ brand: brand.slug, model: model.slug, variant: v.slug, city: city.slug, variantId: v.id })),
    city.id,
    data,
  );

  return {
    brand, model, variant, city, state, rto, dealer,
    offer: offersData.offer,
    dealerOffers: offersData.dealerOffers,
    breakdown: pricing.breakdown,
    modelVariants: siblings,
    variantPrices: variantPricesRaw.map((r) => ({ variant: r.variant, breakdown: r.breakdown })),
  };
}

// ── Tier 2: Full dataset fallback ─────────────────────────────────────────────

async function tier2(params: { brand?: string; model?: string; variant?: string; city?: string }): Promise<OnRoadPageData> {
  const data = await getVehicleDataSet();
  const pricing = calculateOnRoadPriceFromData(params, data);

  const modelVariants = data.variants
    .filter((v) => v.active && v.modelId === pricing.model.id)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice);

  const variantPricesRaw = await batchCalculateWithCache(
    modelVariants.map((v) => ({
      brand: pricing.brand.slug,
      model: pricing.model.slug,
      variant: v.slug,
      city: pricing.city.slug,
      variantId: v.id,
    })),
    pricing.city.id,
    data,
  );

  // Write main pricing to cache (Tier 2 write-back)
  setCachedPricing(pricing.variant.id, pricing.city.id, pricing.breakdown).catch(() => {});

  return {
    brand: pricing.brand,
    model: pricing.model,
    variant: pricing.variant,
    city: pricing.city,
    state: pricing.state,
    rto: pricing.rto,
    dealer: pricing.dealer,
    offer: pricing.offer,
    dealerOffers: pricing.dealerOffers,
    breakdown: pricing.breakdown,
    modelVariants,
    variantPrices: variantPricesRaw.map((r) => ({ variant: r.variant, breakdown: r.breakdown })),
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

// /on-road-price reads searchParams, so the *route* is inherently dynamic and can never
// be prerendered. The *data* still can be: a given brand+model+variant+city always
// resolves to the same result until an admin edits the catalog or a pricing rule. The
// sitemap advertises ~345 of these combinations, so this turns the crawler's repeated
// sweeps into ~345 cache entries of ~12 KB instead of ~345 × N live Supabase reads.
//
// Positional string args (not the params object) so the cache key is stable regardless
// of query-string ordering or extra unrelated params on the URL.
const getCachedOnRoadPriceData = unstable_cache(
  (brand: string, model: string, variant: string, city: string) =>
    resolveOnRoadPriceData({ brand, model, variant, city }),
  ["on-road-price"],
  // 24h, not the 6h used for the catalog: there are ~345 of these entries against one
  // catalog entry, so TTL expiry here dominates total egress. Every price input
  // (variant, tax rule, rto charge, insurance rule, offer) invalidates by tag on write.
  { revalidate: 86400, tags: [CATALOG_TAG] },
);

export async function getOnRoadPriceData(params: {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
}): Promise<OnRoadPageData> {
  // Only the fully-qualified canonical shape is cacheable — a partial query resolves
  // against defaults that depend on live catalog ordering, so it goes straight through.
  if (params.brand && params.model && params.variant && params.city) {
    return getCachedOnRoadPriceData(params.brand, params.model, params.variant, params.city);
  }
  return resolveOnRoadPriceData(params);
}

async function resolveOnRoadPriceData(params: {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
}): Promise<OnRoadPageData> {
  if (!params.variant || !params.city) return tier2(params);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return tier2(params);

  const resolved = await resolveVariantAndCity(supabase, params.variant, params.city, params.model);
  if (!resolved) return tier2(params);

  const { variant, model, brand, city, state } = resolved;

  const [cachedBreakdown, siblings, rto, dealer, offersData] = await Promise.all([
    getCachedPricing(variant.id, city.id),
    fetchSiblings(supabase, model.id),
    fetchRto(supabase, city.id, city.defaultRtoId),
    fetchDealer(supabase, brand.id, city.id),
    fetchOffers(supabase, brand.id, model.id, city.id),
  ]);

  if (!cachedBreakdown) {
    return computeMinimalPricing(supabase, { variant, model, brand, city, state, rto, dealer, offersData, siblings }, params);
  }

  // Round 3: sibling prices from cache
  const siblingPriceMap = await batchGetCachedPricing(siblings.map((s) => s.id), city.id);

  const variantPrices = siblings.map((sib) => ({
    variant: sib,
    breakdown: siblingPriceMap.get(sib.id) ?? emptyBreakdown(sib.exShowroomPrice),
  }));

  return {
    brand,
    model,
    variant,
    city,
    state,
    rto,
    dealer,
    offer: offersData.offer,
    dealerOffers: offersData.dealerOffers,
    breakdown: cachedBreakdown,
    modelVariants: siblings,
    variantPrices,
  };
}
