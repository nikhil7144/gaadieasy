import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getBrowseDataSet,
  mapCityPage,
  mapDealer,
  mapDealerBrandMapping,
  mapGstRule,
  mapInsuranceRule,
  mapOffer,
  mapRegistrationFeeRule,
  mapRtoCharge,
  mapRtoOffice,
  mapState,
  mapTaxRule,
  type VehicleDataSet,
} from "@/lib/repositories/vehicle-data";
import { calculateOnRoadPriceFromData } from "@/lib/services/pricing";
import type { Brand, PricingResult, VehicleCategory, VehicleModel } from "@/types/automobile";

export type CityModelCard = {
  brand: Brand;
  model: VehicleModel;
  category: VehicleCategory;
  pricing: PricingResult;
};

type Supa = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type R = Record<string, unknown>;

async function resolveCityPage(supabase: Supa, slug: string) {
  const [cityPageRes, browse] = await Promise.all([
    supabase.from("city_pages").select("*").eq("slug", slug).eq("active", true).limit(1).maybeSingle(),
    getBrowseDataSet(),
  ]);
  if (!cityPageRes.data) return null;
  const cityPage = mapCityPage(cityPageRes.data as R);

  const city = browse.cities.find((item) => item.id === cityPage.cityId);
  if (!city) return null;

  const [stateRes, rtoRes] = await Promise.all([
    supabase.from("states").select("*").eq("id", city.stateId).limit(1).maybeSingle(),
    supabase.from("rto_offices").select("*").or(`id.eq.${city.defaultRtoId},city_id.eq.${city.id}`).limit(1).maybeSingle(),
  ]);
  const state = stateRes.data ? mapState(stateRes.data as R) : undefined;
  if (!state) return null;
  const rto = rtoRes.data ? mapRtoOffice(rtoRes.data as R) : undefined;

  return { cityPage, city, state, rto, browse };
}

async function fetchCityPricingTables(supabase: Supa, stateId: string, cityId: string, excludeCityPageId: string) {
  const [taxRes, rtoChargeRes, dealerMapRes, dealersRes, offersRes, gstRes, regFeeRes, insuranceRes, relatedRes] = await Promise.all([
    supabase.from("state_tax_rules").select("*").eq("state_id", stateId),
    supabase.from("rto_charges").select("*").eq("city_id", cityId),
    supabase.from("dealer_brand_mappings").select("*").eq("city_id", cityId).eq("active", true),
    supabase.from("dealers").select("*").eq("city_id", cityId).eq("active", true).order("verified", { ascending: false }).order("priority", { ascending: false }).limit(6),
    supabase.from("offers").select("*").eq("active", true).or(`city_id.is.null,city_id.eq.${cityId}`),
    supabase.from("gst_rules").select("*"),
    supabase.from("registration_fee_rules").select("*"),
    supabase.from("insurance_rules").select("*"),
    supabase.from("city_pages").select("*").eq("active", true).neq("id", excludeCityPageId).order("display_order", { ascending: true }).order("title", { ascending: true }).limit(8),
  ]);

  return {
    taxRules: (taxRes.data ?? []).map((r) => mapTaxRule(r as R)),
    rtoCharges: (rtoChargeRes.data ?? []).map((r) => mapRtoCharge(r as R)),
    dealerBrandMappings: (dealerMapRes.data ?? []).map((r) => mapDealerBrandMapping(r as R)),
    dealers: (dealersRes.data ?? []).map((r) => mapDealer(r as R)),
    offers: (offersRes.data ?? []).map((r) => mapOffer(r as R)),
    gstRules: (gstRes.data ?? []).map((r) => mapGstRule(r as R)),
    registrationFeeRules: (regFeeRes.data ?? []).map((r) => mapRegistrationFeeRule(r as R)),
    insuranceRules: (insuranceRes.data ?? []).map((r) => mapInsuranceRule(r as R)),
    relatedCityPages: (relatedRes.data ?? []).map((r) => mapCityPage(r as R)),
  };
}

export async function getCityPageView(slug: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const resolved = await resolveCityPage(supabase, slug);
  if (!resolved) return null;
  const { cityPage, city, state, rto, browse } = resolved;

  const pricingTables = await fetchCityPricingTables(supabase, state.id, city.id, cityPage.id);

  const featuredBrandSet = new Set(cityPage.featuredBrandIds);
  const activeModels = browse.models.filter((model) => model.active);
  const activeBrands = browse.brands.filter((brand) => brand.active);
  const activeVariants = browse.variants.filter((variant) => variant.active);

  const data: VehicleDataSet = {
    categories: browse.categories,
    brands: activeBrands,
    models: activeModels,
    variants: activeVariants,
    media: [],
    states: [state],
    cities: [city],
    rtoOffices: rto ? [rto] : [],
    taxRules: pricingTables.taxRules,
    rtoCharges: pricingTables.rtoCharges,
    insuranceRules: pricingTables.insuranceRules,
    gstRules: pricingTables.gstRules,
    registrationFeeRules: pricingTables.registrationFeeRules,
    dealerBusinesses: [],
    dealers: pricingTables.dealers,
    dealerUsers: [],
    dealerBrandMappings: pricingTables.dealerBrandMappings,
    offers: pricingTables.offers,
    heroPromotions: [],
    cityPages: [cityPage],
  };

  const cards = activeModels
    .map((model) => {
      const brand = activeBrands.find((item) => item.id === model.brandId);
      const category = browse.categories.find((item) => item.id === model.categoryId);
      const variant =
        activeVariants.find((item) => item.modelId === model.id && item.isDefault) ??
        activeVariants
          .filter((item) => item.modelId === model.id)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice)[0];

      if (!brand || !category || !variant) return null;

      return {
        brand,
        model,
        category,
        pricing: calculateOnRoadPriceFromData(
          { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
          data,
        ),
      };
    })
    .filter((item): item is CityModelCard => Boolean(item))
    .sort((a, b) => {
      const featuredDelta = Number(featuredBrandSet.has(b.brand.id)) - Number(featuredBrandSet.has(a.brand.id));
      return featuredDelta || Number(b.model.featured) - Number(a.model.featured) || a.model.name.localeCompare(b.model.name);
    });

  const featuredModels = cards
    .filter((card) => !cityPage.featuredCategoryId || card.category.id === cityPage.featuredCategoryId)
    .slice(0, 6);

  const categorySections = browse.categories
    .map((category) => ({
      category,
      models: cards.filter((card) => card.category.id === category.id).slice(0, 6),
    }))
    .filter((section) => section.models.length);

  const brandIdsWithModels = new Set(cards.map((card) => card.brand.id));
  const brands = activeBrands
    .filter((brand) => brandIdsWithModels.has(brand.id))
    .sort((a, b) => {
      const featuredDelta = Number(featuredBrandSet.has(b.id)) - Number(featuredBrandSet.has(a.id));
      return featuredDelta || a.name.localeCompare(b.name);
    })
    .slice(0, 10);

  return {
    cityPage,
    city,
    state,
    rto,
    featuredModels,
    categorySections,
    brands,
    dealers: pricingTables.dealers,
    relatedCityPages: pricingTables.relatedCityPages,
  };
}
