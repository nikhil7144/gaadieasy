import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { batchCalculateWithCache, calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import { batchGetCachedPricing, getCachedPricing, setCachedPricing } from "@/lib/services/pricing-cache";
import type { Brand, City, Dealer, Offer, PriceBreakdown, RtoOffice, State, VehicleModel, VehicleVariant } from "@/types/automobile";

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
  modelVariants: VehicleVariant[];
  variantPrices: Array<{ variant: VehicleVariant; breakdown: PriceBreakdown }>;
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

async function fetchSiblings(supabase: Supa, modelId: string) {
  const { data } = await supabase
    .from("vehicle_variants")
    .select("*")
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

// Deduplicated per-request: generateMetadata + page component both call this,
// cache() ensures Supabase queries only fire once per render.
const fetchOnRoadPriceData = cache(async (
  brand: string | undefined,
  model: string | undefined,
  variant: string | undefined,
  city: string | undefined,
): Promise<OnRoadPageData> => {
  return _getOnRoadPriceData({ brand, model, variant, city });
});

export function getOnRoadPriceData(params: {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
}): Promise<OnRoadPageData> {
  return fetchOnRoadPriceData(params.brand, params.model, params.variant, params.city);
}

async function _getOnRoadPriceData(params: {
  brand?: string;
  model?: string;
  variant?: string;
  city?: string;
}): Promise<OnRoadPageData> {
  if (!params.variant || !params.city) return tier2(params);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return tier2(params);

  // Round 1: resolve slugs → typed entities (model slug constrains variant lookup to avoid slug collisions)
  const resolved = await resolveVariantAndCity(supabase, params.variant, params.city, params.model);
  if (!resolved) return tier2(params);

  const { variant, model, brand, city, state } = resolved;

  // Round 2: cache check + all display data in parallel
  const [cachedBreakdown, siblings, rto, dealer, offersData] = await Promise.all([
    getCachedPricing(variant.id, city.id),
    fetchSiblings(supabase, model.id),
    fetchRto(supabase, city.id, city.defaultRtoId),
    fetchDealer(supabase, brand.id, city.id),
    fetchOffers(supabase, brand.id, model.id, city.id),
  ]);

  // Cache miss → Tier 2 (targeted data fetched above is discarded, full dataset loaded)
  if (!cachedBreakdown) return tier2(params);

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
