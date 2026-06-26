import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidateCacheForVariant, invalidateCacheForState } from "@/lib/services/pricing-cache";
import { slugify } from "@/lib/utils/format";
import type {
  Brand,
  City,
  CityPage,
  Dealer,
  DealerBrandMapping,
  DealerBusiness,
  DealerUser,
  HeroPromotion,
  InsuranceRule,
  RtoCharge,
  SpecificationGroup,
  StateTaxRule,
  VehicleModel,
  VehicleVariant,
} from "@/types/automobile";

type DbRow = Record<string, unknown>;

function optionalText(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

function arrayFromText(value?: string[] | null) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function mapBrand(row: DbRow): Brand {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : undefined,
    categoryIds: Array.isArray(row.category_ids) ? (row.category_ids as string[]) : [],
    active: Boolean(row.active),
    featured: Boolean(row.featured),
  };
}

function mapModel(row: DbRow): VehicleModel {
  return {
    id: String(row.id),
    brandId: String(row.brand_id),
    categoryId: String(row.category_id),
    name: String(row.name),
    slug: String(row.slug),
    bodyType: String(row.body_type ?? ""),
    loaderSize: typeof row.loader_size === "string" ? (row.loader_size as VehicleModel["loaderSize"]) : undefined,
    imageUrl: String(row.image_url ?? ""),
    launchLabel: typeof row.launch_label === "string" ? row.launch_label : undefined,
    overview: typeof row.overview === "string" ? row.overview : undefined,
    pros: Array.isArray(row.pros) ? (row.pros as string[]) : [],
    cons: Array.isArray(row.cons) ? (row.cons as string[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as VehicleModel["faq"]) : [],
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    isUpcoming: Boolean(row.is_upcoming),
  };
}

function mapHeroPromotion(row: DbRow): HeroPromotion {
  return {
    id: String(row.id),
    placement: typeof row.placement === "string" ? (row.placement as HeroPromotion["placement"]) : "homepage_hero",
    eyebrow: typeof row.eyebrow === "string" ? row.eyebrow : undefined,
    headline: typeof row.headline === "string" ? row.headline : undefined,
    supportingCopy: typeof row.supporting_copy === "string" ? row.supporting_copy : undefined,
    title: String(row.title),
    subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
    ctaLabel: typeof row.cta_label === "string" ? row.cta_label : undefined,
    stat1Label: typeof row.stat_1_label === "string" ? row.stat_1_label : undefined,
    stat1Value: typeof row.stat_1_value === "string" ? row.stat_1_value : undefined,
    stat2Label: typeof row.stat_2_label === "string" ? row.stat_2_label : undefined,
    stat2Value: typeof row.stat_2_value === "string" ? row.stat_2_value : undefined,
    stat3Label: typeof row.stat_3_label === "string" ? row.stat_3_label : undefined,
    stat3Value: typeof row.stat_3_value === "string" ? row.stat_3_value : undefined,
    imageUrl: String(row.image_url),
    categoryKey: String(row.category_key) as HeroPromotion["categoryKey"],
    brandId: typeof row.brand_id === "string" ? row.brand_id : undefined,
    modelId: typeof row.model_id === "string" ? row.model_id : undefined,
    variantId: typeof row.variant_id === "string" ? row.variant_id : undefined,
    targetUrl: String(row.target_url),
    active: Boolean(row.active),
  };
}

function mapCityPage(row: DbRow): CityPage {
  return {
    id: String(row.id),
    cityId: String(row.city_id),
    slug: String(row.slug),
    title: String(row.title),
    h1: String(row.h1),
    metaTitle: String(row.meta_title),
    metaDescription: String(row.meta_description),
    intro: String(row.intro ?? ""),
    body: String(row.body ?? ""),
    heroImageUrl: typeof row.hero_image_url === "string" ? row.hero_image_url : undefined,
    featuredCategoryId: typeof row.featured_category_id === "string" ? row.featured_category_id : undefined,
    featuredBrandIds: Array.isArray(row.featured_brand_ids) ? (row.featured_brand_ids as string[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as CityPage["faq"]) : [],
    showInFooter: Boolean(row.show_in_footer),
    displayOrder: Number(row.display_order ?? 0),
    active: Boolean(row.active),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

function mapVariant(row: DbRow): VehicleVariant {
  return {
    id: String(row.id),
    modelId: String(row.model_id),
    name: String(row.name),
    slug: String(row.slug),
    exShowroomPrice: Number(row.ex_showroom_price ?? 0),
    fuelType: String(row.fuel_type) as VehicleVariant["fuelType"],
    transmission: String(row.transmission) as VehicleVariant["transmission"],
    engineCapacity: String(row.engine_capacity ?? ""),
    mileage: String(row.mileage ?? ""),
    seatingCapacity: Number(row.seating_capacity ?? 0),
    specifications: (row.specifications ?? {}) as VehicleVariant["specifications"],
    specificationGroups: Array.isArray(row.specification_groups)
      ? (row.specification_groups as VehicleVariant["specificationGroups"])
      : [],
    isDefault: Boolean(row.is_default),
    displayOrder: Number(row.display_order ?? 0),
    active: Boolean(row.active),
  };
}

function mapDealerBusiness(row: DbRow): DealerBusiness {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    active: Boolean(row.active),
    verified: Boolean(row.verified),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

function mapDealer(row: DbRow): Dealer {
  return {
    id: String(row.id),
    dealerBusinessId: typeof row.dealer_business_id === "string" ? row.dealer_business_id : undefined,
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : undefined,
    cityId: String(row.city_id),
    area: String(row.area ?? ""),
    contactPerson: String(row.contact_person ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    gstNumber: typeof row.gst_number === "string" ? row.gst_number : undefined,
    active: Boolean(row.active),
    verified: Boolean(row.verified),
    priority: Number(row.priority ?? 0),
  };
}

function mapDealerBrandMapping(row: DbRow): DealerBrandMapping {
  return {
    id: String(row.id),
    dealerId: String(row.dealer_id),
    brandId: String(row.brand_id),
    cityId: String(row.city_id),
    active: Boolean(row.active),
  };
}

function mapDealerUser(row: DbRow): DealerUser {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    dealerBusinessId: String(row.dealer_business_id),
    dealerId: typeof row.dealer_id === "string" ? row.dealer_id : undefined,
    role: String(row.role) as DealerUser["role"],
    active: Boolean(row.active),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

function mapTaxRule(row: DbRow): StateTaxRule {
  return {
    id: String(row.id),
    stateId: String(row.state_id),
    categoryId: String(row.category_id),
    fuelType: typeof row.fuel_type === "string" ? (row.fuel_type as StateTaxRule["fuelType"]) : undefined,
    minPrice: Number(row.min_price ?? 0),
    maxPrice: row.max_price === null || row.max_price === undefined ? undefined : Number(row.max_price),
    roadTaxPercent: Number(row.road_tax_percent ?? 0),
    fixedTaxAmount: Number(row.fixed_tax_amount ?? 0),
    evExemptionPercent: Number(row.ev_exemption_percent ?? 0),
    luxuryCessPercent: Number(row.luxury_cess_percent ?? 0),
    active: Boolean(row.active),
  };
}

function mapRtoCharge(row: DbRow): RtoCharge {
  return {
    id: String(row.id),
    stateId: String(row.state_id),
    cityId: String(row.city_id),
    rtoId: String(row.rto_id ?? ""),
    registrationFee: Number(row.registration_fee ?? 0),
    smartCardFee: Number(row.smart_card_fee ?? 0),
    numberPlateFee: Number(row.number_plate_fee ?? 0),
    hypothecationFee: Number(row.hypothecation_fee ?? 0),
    fastagFee: Number(row.fastag_fee ?? 0),
    handlingCharges: Number(row.handling_charges ?? 0),
    active: Boolean(row.active),
  };
}

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function fieldValue(group: Record<string, unknown>, key: string) {
  const value = group[key];
  return typeof value === "string" && value ? value : undefined;
}

function vehicleMediaStoragePath(url?: string | null) {
  if (!url) return null;
  const marker = "/vehicle-media/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  const rawPath = url.slice(markerIndex + marker.length).split("?")[0];
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

function buildSpecificationGroups(specifications: Record<string, unknown>): SpecificationGroup[] {
  const engine = objectValue(specifications.engine);
  const dimensions = objectValue(specifications.dimensions);
  const interior = objectValue(specifications.interior);
  const exterior = objectValue(specifications.exterior);
  const safety = objectValue(specifications.safety);
  const ev = objectValue(specifications.ev);
  const commercial = objectValue(specifications.commercial);
  const bike = objectValue(specifications.bike);

  const groups: SpecificationGroup[] = [
    {
      title: "Engine and transmission",
      description: "Powertrain, torque, drive and emission details.",
      fields: [
        { label: "Engine / battery", value: fieldValue(engine, "displacement") },
        { label: "Power", value: fieldValue(engine, "maxPower") },
        { label: "Torque", value: fieldValue(engine, "maxTorque") },
        { label: "Drive type", value: fieldValue(engine, "driveType") },
        { label: "Emission norm", value: fieldValue(engine, "emissionNorm") },
      ],
    },
    {
      title: "Dimensions and capacity",
      description: "Physical dimensions and storage/capacity information.",
      fields: [
        { label: "Length", value: fieldValue(dimensions, "length") },
        { label: "Width", value: fieldValue(dimensions, "width") },
        { label: "Height", value: fieldValue(dimensions, "height") },
        { label: "Wheelbase", value: fieldValue(dimensions, "wheelbase") },
        { label: "Boot / storage / cargo", value: fieldValue(dimensions, "bootSpace") },
        { label: "Ground clearance", value: fieldValue(dimensions, "groundClearance") },
      ],
    },
    {
      title: "Interior specification",
      description: "Cabin, dashboard, infotainment and seating details.",
      fields: [
        { label: "Upholstery", value: fieldValue(interior, "upholstery") },
        { label: "Dashboard / console", value: fieldValue(interior, "dashboard") },
        { label: "Infotainment", value: fieldValue(interior, "infotainment") },
        { label: "Speakers", value: fieldValue(interior, "speakers") },
        { label: "Air conditioning", value: fieldValue(interior, "airConditioning") },
        { label: "Seat features", value: fieldValue(interior, "seatFeatures") },
      ],
    },
    {
      title: "Exterior specification",
      description: "Lighting, wheels, roof and visible equipment.",
      fields: [
        { label: "Headlamps / lighting", value: fieldValue(exterior, "headlamps") },
        { label: "Wheels / tyres", value: fieldValue(exterior, "wheels") },
        { label: "Roof rails / carrier", value: fieldValue(exterior, "roofRails") },
        { label: "Sunroof / open feature", value: fieldValue(exterior, "sunroof") },
      ],
    },
    {
      title: "Safety specification",
      description: "Safety equipment, braking, camera and rating information.",
      fields: [
        { label: "Airbags", value: fieldValue(safety, "airbags") },
        { label: "ABS / braking", value: fieldValue(safety, "abs") },
        { label: "Stability control", value: fieldValue(safety, "esc") },
        { label: "Camera", value: fieldValue(safety, "camera") },
        { label: "Sensors", value: fieldValue(safety, "sensors") },
        { label: "Safety rating", value: fieldValue(safety, "rating") },
      ],
    },
    {
      title: "EV battery and charging",
      description: "Battery, charging and range details for EV variants.",
      fields: [
        { label: "Battery capacity", value: fieldValue(ev, "batteryCapacity") },
        { label: "Battery warranty", value: fieldValue(ev, "batteryHealth") },
        { label: "Claimed range", value: fieldValue(ev, "claimedRange") },
        { label: "Real-world range", value: fieldValue(ev, "realWorldRange") },
        { label: "Charger type", value: fieldValue(ev, "chargerType") },
        { label: "Charging time", value: fieldValue(ev, "chargingTime") },
      ],
    },
    {
      title: "Commercial and permit details",
      description: "Payload, body and usage fields for business vehicles.",
      fields: [
        { label: "Payload capacity", value: fieldValue(commercial, "payloadCapacity") },
        { label: "Body length", value: fieldValue(commercial, "bodyLength") },
        { label: "Axle configuration", value: fieldValue(commercial, "axleConfiguration") },
        { label: "Permit type", value: fieldValue(commercial, "permitType") },
        { label: "Fleet usage", value: fieldValue(commercial, "fleetUsageType") },
        { label: "Tyre details", value: fieldValue(commercial, "tyreCondition") },
      ],
    },
    {
      title: "Two-wheeler details",
      description: "Riding, braking, suspension and wheel details.",
      fields: [
        { label: "Brake type", value: fieldValue(bike, "brakeType") },
        { label: "Suspension", value: fieldValue(bike, "suspensionType") },
        { label: "Wheel size", value: fieldValue(bike, "wheelSize") },
        { label: "Seat height", value: fieldValue(bike, "seatHeight") },
        { label: "Kerb weight", value: fieldValue(bike, "kerbWeight") },
        { label: "Riding modes", value: fieldValue(bike, "ridingModes") },
      ],
    },
  ];

  return groups
    .map((group) => ({ ...group, fields: group.fields.filter((field) => field.value) }))
    .filter((group) => group.fields.length);
}

function resolveEngineCapacity(input: {
  engineCapacity?: string;
  fuelType: VehicleVariant["fuelType"];
  specifications: Record<string, unknown>;
}) {
  const engine = objectValue(input.specifications.engine);
  const ev = objectValue(input.specifications.ev);
  const displacement = fieldValue(engine, "displacement");
  const batteryCapacity = fieldValue(ev, "batteryCapacity");
  return input.engineCapacity || displacement || batteryCapacity || (input.fuelType === "Electric" ? "Battery details pending" : "Engine details pending");
}

function resolveMileage(input: { mileage?: string; specifications: Record<string, unknown> }) {
  const ev = objectValue(input.specifications.ev);
  return input.mileage || fieldValue(ev, "claimedRange") || "Mileage pending";
}

async function findModelBySlug(slug: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("vehicle_models").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapModel(data as DbRow) : null;
}

async function findVariantByModelAndSlug(modelId: string, slug: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("vehicle_variants")
    .select("*")
    .eq("model_id", modelId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapVariant(data as DbRow) : null;
}

export async function createBrand(input: {
  name: string;
  slug?: string;
  logoUrl?: string;
  categoryIds?: string[];
  active: boolean;
  featured: boolean;
  overview?: string;
  tagline?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      logo_url: optionalText(input.logoUrl),
      category_ids: arrayFromText(input.categoryIds),
      active: input.active,
      featured: input.featured,
      overview: optionalText(input.overview),
      tagline: optionalText(input.tagline),
      seo_title: optionalText(input.seoTitle),
      seo_description: optionalText(input.seoDescription),
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/", "layout");
  return mapBrand(data as DbRow);
}

export async function updateBrand(input: {
  id: string;
  name?: string;
  slug?: string;
  logoUrl?: string;
  categoryIds?: string[];
  active?: boolean;
  featured?: boolean;
  overview?: string;
  tagline?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.logoUrl !== undefined) patch.logo_url = optionalText(input.logoUrl);
  if (input.categoryIds !== undefined) patch.category_ids = arrayFromText(input.categoryIds);
  if (input.active !== undefined) patch.active = input.active;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.overview !== undefined) patch.overview = optionalText(input.overview);
  if (input.tagline !== undefined) patch.tagline = optionalText(input.tagline);
  if (input.seoTitle !== undefined) patch.seo_title = optionalText(input.seoTitle);
  if (input.seoDescription !== undefined) patch.seo_description = optionalText(input.seoDescription);

  const { data, error } = await supabase.from("brands").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/", "layout");
  return mapBrand(data as DbRow);
}

export async function deleteBrand(id: string) {
  const supabase = getAdminClient();

  const [{ count: modelCount, error: modelError }, { count: leadCount, error: leadError }] = await Promise.all([
    supabase.from("vehicle_models").select("id", { count: "exact", head: true }).eq("brand_id", id),
    supabase.from("vehicle_leads").select("id", { count: "exact", head: true }).eq("brand_id", id),
  ]);

  if (modelError) throw modelError;
  if (leadError) throw leadError;

  const blockers = [
    modelCount ? `${modelCount} model${modelCount === 1 ? "" : "s"}` : "",
    leadCount ? `${leadCount} lead${leadCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  if (blockers.length) {
    throw new Error(`Cannot delete this brand because it is linked to ${blockers.join(" and ")}. Make it inactive instead, or remove linked records first.`);
  }

  const { error: mappingError } = await supabase.from("dealer_brand_mappings").delete().eq("brand_id", id);
  if (mappingError) throw mappingError;

  const { error: offerError } = await supabase.from("offers").delete().eq("brand_id", id);
  if (offerError) throw offerError;

  const { error: promotionError } = await supabase.from("hero_promotions").delete().eq("brand_id", id);
  if (promotionError) throw promotionError;

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/", "layout");

  return { id };
}

export async function createDealerBusiness(input: {
  name: string;
  slug?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  active: boolean;
  verified: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("dealer_businesses")
    .insert({
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      logo_url: optionalText(input.logoUrl),
      phone: optionalText(input.phone),
      email: optionalText(input.email),
      active: input.active,
      verified: input.verified,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/dealers");
  return mapDealerBusiness(data as DbRow);
}

export async function createDealer(input: {
  dealerBusinessId?: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  cityId: string;
  area?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  active: boolean;
  verified: boolean;
  priority: number;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("dealers")
    .insert({
      dealer_business_id: optionalText(input.dealerBusinessId),
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      logo_url: optionalText(input.logoUrl),
      city_id: input.cityId,
      area: optionalText(input.area),
      contact_person: optionalText(input.contactPerson),
      phone: optionalText(input.phone),
      email: optionalText(input.email),
      gst_number: optionalText(input.gstNumber),
      active: input.active,
      verified: input.verified,
      priority: input.priority,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/dealers");
  return mapDealer(data as DbRow);
}

export async function createDealerBrandMapping(input: {
  dealerId: string;
  brandId: string;
  cityId: string;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("dealer_brand_mappings")
    .upsert(
      {
        dealer_id: input.dealerId,
        brand_id: input.brandId,
        city_id: input.cityId,
        active: input.active,
      },
      { onConflict: "dealer_id,brand_id,city_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/dealers");
  return mapDealerBrandMapping(data as DbRow);
}

async function createDealerAuthUser(input: { email: string; password: string }) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message || "Unable to create dealer login");
  }

  if (!data.user) {
    throw new Error("Dealer login user was not returned by Supabase.");
  }

  return data.user;
}

export async function createDealerBusinessLogin(input: {
  dealerBusinessId: string;
  email: string;
  password: string;
}) {
  const supabase = getAdminClient();
  const authUser = await createDealerAuthUser(input);

  const { data, error } = await supabase
    .from("dealer_users")
    .insert({
      user_id: authUser.id,
      dealer_business_id: input.dealerBusinessId,
      dealer_id: null,
      role: "dealer_business_admin",
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.id);
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dealers");
  return mapDealerUser(data as DbRow);
}

export async function createDealerShowroomLogin(input: {
  dealerBusinessId: string;
  dealerId: string;
  email: string;
  password: string;
}) {
  const supabase = getAdminClient();
  const authUser = await createDealerAuthUser(input);

  const { data, error } = await supabase
    .from("dealer_users")
    .insert({
      user_id: authUser.id,
      dealer_business_id: input.dealerBusinessId,
      dealer_id: input.dealerId,
      role: "dealer_showroom_user",
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authUser.id);
    throw error;
  }

  revalidatePath("/dealer");
  revalidatePath("/admin");
  revalidatePath("/admin/dealers");
  return mapDealerUser(data as DbRow);
}

export async function createModel(input: {
  brandId: string;
  categoryId: string;
  name: string;
  slug?: string;
  bodyType: string;
  launchLabel?: string;
  loaderSize?: VehicleModel["loaderSize"] | "";
  noOfWheels?: number;
  tags?: string[];
  imageUrl?: string;
  overview?: string;
  pros?: string[];
  cons?: string[];
  faq?: VehicleModel["faq"];
  active: boolean;
  featured: boolean;
  isUpcoming?: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("vehicle_models")
    .insert({
      brand_id: input.brandId,
      category_id: input.categoryId,
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      body_type: input.bodyType,
      launch_label: optionalText(input.launchLabel),
      loader_size: optionalText(input.loaderSize),
      no_of_wheels: input.noOfWheels ?? null,
      tags: input.tags ?? [],
      image_url: optionalText(input.imageUrl),
      overview: optionalText(input.overview),
      pros: arrayFromText(input.pros),
      cons: arrayFromText(input.cons),
      faq: Array.isArray(input.faq) ? input.faq : [],
      active: input.active,
      featured: input.featured,
      is_upcoming: input.isUpcoming ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/", "layout");
  return mapModel(data as DbRow);
}

export async function updateModel(input: Partial<Parameters<typeof createModel>[0]> & { id: string }) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.brandId !== undefined) patch.brand_id = input.brandId;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.bodyType !== undefined) patch.body_type = input.bodyType;
  if (input.launchLabel !== undefined) patch.launch_label = optionalText(input.launchLabel);
  if (input.loaderSize !== undefined) patch.loader_size = optionalText(input.loaderSize);
  if (input.noOfWheels !== undefined) patch.no_of_wheels = input.noOfWheels ?? null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.imageUrl !== undefined) patch.image_url = optionalText(input.imageUrl);
  if (input.overview !== undefined) patch.overview = optionalText(input.overview);
  if (input.pros !== undefined) patch.pros = arrayFromText(input.pros);
  if (input.cons !== undefined) patch.cons = arrayFromText(input.cons);
  if (input.faq !== undefined) patch.faq = Array.isArray(input.faq) ? input.faq : [];
  if (input.active !== undefined) patch.active = input.active;
  if (input.featured !== undefined) patch.featured = input.featured;
  if (input.isUpcoming !== undefined) patch.is_upcoming = input.isUpcoming;

  const { data, error } = await supabase.from("vehicle_models").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/", "layout");
  return mapModel(data as DbRow);
}

export async function deleteModel(id: string) {
  const supabase = getAdminClient();

  const { data: model, error: modelError } = await supabase
    .from("vehicle_models")
    .select("id,image_url")
    .eq("id", id)
    .maybeSingle();
  if (modelError) throw modelError;
  if (!model) throw new Error("Model not found.");

  const { count: leadCount, error: leadError } = await supabase
    .from("vehicle_leads")
    .select("id", { count: "exact", head: true })
    .eq("model_id", id);

  if (leadError) throw leadError;

  if (leadCount) {
    throw new Error(`Cannot delete this model because it is linked to ${leadCount} lead${leadCount === 1 ? "" : "s"}. Make it inactive instead, or remove linked leads first.`);
  }

  const { data: variants, error: variantsError } = await supabase
    .from("vehicle_variants")
    .select("id")
    .eq("model_id", id);
  if (variantsError) throw variantsError;

  const variantIds = (variants ?? []).map((variant) => String(variant.id));

  const { data: mediaRows, error: mediaFetchError } = await supabase
    .from("vehicle_media")
    .select("url")
    .eq("model_id", id);
  if (mediaFetchError) throw mediaFetchError;

  const storagePaths = Array.from(
    new Set(
      [
        vehicleMediaStoragePath(typeof model.image_url === "string" ? model.image_url : null),
        ...(mediaRows ?? []).map((row) => vehicleMediaStoragePath(typeof row.url === "string" ? row.url : null)),
      ].filter((path): path is string => Boolean(path)),
    ),
  );

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage.from("vehicle-media").remove(storagePaths);
    if (storageError) throw storageError;
  }

  const comparisonDeleteFilters = [
    `v1_model_id.eq.${id}`,
    `v2_model_id.eq.${id}`,
    `v3_model_id.eq.${id}`,
    ...variantIds.flatMap((variantId) => [
      `v1_variant_id.eq.${variantId}`,
      `v2_variant_id.eq.${variantId}`,
      `v3_variant_id.eq.${variantId}`,
    ]),
  ];

  const { error: comparisonError } = await supabase
    .from("comparison_pages")
    .delete()
    .or(comparisonDeleteFilters.join(","));
  if (comparisonError) throw comparisonError;

  const { error: offerError } = await supabase.from("offers").delete().eq("model_id", id);
  if (offerError) throw offerError;

  const { error: modelPromotionError } = await supabase.from("hero_promotions").delete().eq("model_id", id);
  if (modelPromotionError) throw modelPromotionError;

  if (variantIds.length) {
    const { error: variantPromotionError } = await supabase.from("hero_promotions").delete().in("variant_id", variantIds);
    if (variantPromotionError) throw variantPromotionError;
  }

  const { error: storyError } = await supabase.from("vehicle_stories").delete().eq("model_id", id);
  if (storyError) throw storyError;

  const { error: mediaError } = await supabase.from("vehicle_media").delete().eq("model_id", id);
  if (mediaError) throw mediaError;

  const { error: variantError } = await supabase.from("vehicle_variants").delete().eq("model_id", id);
  if (variantError) throw variantError;

  const { error } = await supabase.from("vehicle_models").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/", "layout");

  return { id, deletedVariants: variantIds.length, deletedMedia: mediaRows?.length ?? 0 };
}

export async function createVariant(input: {
  modelId: string;
  name: string;
  slug?: string;
  exShowroomPrice: number;
  fuelType: VehicleVariant["fuelType"];
  transmission: VehicleVariant["transmission"];
  engineCapacity: string;
  engineCc?: number;
  maxPowerPs?: number;
  payloadCapacityKg?: number;
  mileage: string;
  seatingCapacity: number;
  specifications: Record<string, unknown>;
  specificationGroups: VehicleVariant["specificationGroups"];
  isDefault?: boolean;
  displayOrder?: number;
  active: boolean;
  skipCachePrefill?: boolean;
}) {
  const supabase = getAdminClient();
  if (input.isDefault) {
    await supabase.from("vehicle_variants").update({ is_default: false }).eq("model_id", input.modelId);
  }
  const { data, error } = await supabase
    .from("vehicle_variants")
    .insert({
      model_id: input.modelId,
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      ex_showroom_price: input.exShowroomPrice,
      fuel_type: input.fuelType,
      transmission: input.transmission,
      engine_capacity: input.engineCapacity,
      engine_cc: input.engineCc ?? null,
      max_power_ps: input.maxPowerPs ?? null,
      payload_capacity_kg: input.payloadCapacityKg ?? null,
      mileage: input.mileage,
      seating_capacity: input.seatingCapacity,
      specifications: input.specifications,
      specification_groups: input.specificationGroups,
      is_default: input.isDefault ?? false,
      display_order: input.displayOrder ?? 0,
      active: input.active,
    })
    .select("*")
    .single();

  if (error) throw error;
  const savedVariant = mapVariant(data as DbRow);
  if (!input.skipCachePrefill) {
    prefillVariantPricingCache(savedVariant).catch(() => {});
  }
  revalidatePath("/", "layout");
  return savedVariant;
}

async function prefillVariantPricingCache(variant: VehicleVariant) {
  await prefillVariantsPricingCache([variant]);
}

// Single getVehicleDataSet() load for all variants — used by bulk import to avoid N×7MB egress.
async function prefillVariantsPricingCache(variants: VehicleVariant[]) {
  if (!variants.length) return;
  const { getVehicleDataSet } = await import("@/lib/repositories/vehicle-data");
  const { calculateOnRoadPriceFromData } = await import("@/lib/services/pricing");
  const { batchSetCachedPricing } = await import("@/lib/services/pricing-cache");

  const dataset = await getVehicleDataSet();
  // Pre-fill metro cities only — smaller cities warm lazily on first user visit.
  // To add/remove a city from pre-fill, toggle is_metro in the cities table.
  const metroCities = dataset.cities.filter((c) => c.isMetro);

  const rows = variants.flatMap((variant) => {
    const model = dataset.models.find((m) => m.id === variant.modelId);
    if (!model) return [];
    const brand = dataset.brands.find((b) => b.id === model.brandId);
    if (!brand) return [];
    return metroCities.map((city) => {
      const result = calculateOnRoadPriceFromData(
        { brand: brand.slug, model: model.slug, variant: variant.slug, city: city.slug },
        dataset,
      );
      return { variantId: variant.id, cityId: city.id, breakdown: result.breakdown };
    });
  });

  await batchSetCachedPricing(rows);
}

export async function updateVariant(input: Partial<Parameters<typeof createVariant>[0]> & { id: string }) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.isDefault) {
    const { data: existing, error: existingError } = await supabase
      .from("vehicle_variants")
      .select("model_id")
      .eq("id", input.id)
      .single();
    if (existingError) throw existingError;
    const targetModelId = input.modelId ?? String(existing.model_id);
    await supabase.from("vehicle_variants").update({ is_default: false }).eq("model_id", targetModelId);
  }

  if (input.modelId !== undefined) patch.model_id = input.modelId;
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.exShowroomPrice !== undefined) patch.ex_showroom_price = input.exShowroomPrice;
  if (input.fuelType !== undefined) patch.fuel_type = input.fuelType;
  if (input.transmission !== undefined) patch.transmission = input.transmission;
  if (input.engineCapacity !== undefined) patch.engine_capacity = input.engineCapacity;
  if (input.engineCc !== undefined) patch.engine_cc = input.engineCc ?? null;
  if (input.maxPowerPs !== undefined) patch.max_power_ps = input.maxPowerPs ?? null;
  if (input.payloadCapacityKg !== undefined) patch.payload_capacity_kg = input.payloadCapacityKg ?? null;
  if (input.mileage !== undefined) patch.mileage = input.mileage;
  if (input.seatingCapacity !== undefined) patch.seating_capacity = input.seatingCapacity;
  if (input.specifications !== undefined) patch.specifications = input.specifications;
  if (input.specificationGroups !== undefined) patch.specification_groups = input.specificationGroups;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("vehicle_variants").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  if (input.exShowroomPrice !== undefined) {
    invalidateCacheForVariant(input.id).catch(() => {});
  }
  revalidatePath("/", "layout");
  return mapVariant(data as DbRow);
}

export async function deleteVariant(id: string) {
  const supabase = getAdminClient();

  const [
    { count: leadCount, error: leadError },
    { count: firstComparisonCount, error: firstComparisonError },
    { count: secondComparisonCount, error: secondComparisonError },
    { count: thirdComparisonCount, error: thirdComparisonError },
  ] = await Promise.all([
    supabase.from("vehicle_leads").select("id", { count: "exact" }).eq("variant_id", id).limit(0),
    supabase.from("comparison_pages").select("id", { count: "exact" }).eq("v1_variant_id", id).limit(0),
    supabase.from("comparison_pages").select("id", { count: "exact" }).eq("v2_variant_id", id).limit(0),
    supabase.from("comparison_pages").select("id", { count: "exact" }).eq("v3_variant_id", id).limit(0),
  ]);

  if (leadError) throw leadError;
  if (firstComparisonError) throw firstComparisonError;
  if (secondComparisonError) throw secondComparisonError;
  if (thirdComparisonError) throw thirdComparisonError;

  const comparisonCount = (firstComparisonCount ?? 0) + (secondComparisonCount ?? 0) + (thirdComparisonCount ?? 0);
  const blockers = [
    leadCount ? `${leadCount} lead${leadCount === 1 ? "" : "s"}` : "",
    comparisonCount ? `${comparisonCount} comparison page${comparisonCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  if (blockers.length) {
    throw new Error(`Cannot delete this variant because it is linked to ${blockers.join(" and ")}. Make it inactive instead, or remove linked records first.`);
  }

  const { error: promotionError } = await supabase.from("hero_promotions").delete().eq("variant_id", id);
  if (promotionError) throw promotionError;

  const { error: mediaError } = await supabase.from("vehicle_media").delete().eq("variant_id", id);
  if (mediaError) throw mediaError;

  // Unlink reviews — keep the review content, just remove the variant reference.
  // Best-effort: if the column doesn't exist or update fails, log and continue.
  const { error: reviewError } = await supabase.from("vehicle_reviews").update({ variant_id: null }).eq("variant_id", id);
  if (reviewError) console.warn("[deleteVariant] vehicle_reviews unlink skipped:", JSON.stringify(reviewError));

  const { error } = await supabase.from("vehicle_variants").delete().eq("id", id);
  if (error) throw error;

  invalidateCacheForVariant(id).catch(() => {});
  revalidatePath("/admin/variants");
  revalidatePath("/", "layout");

  return { id };
}

export async function createModelWithVariants(input: {
  brandId: string;
  categoryId: string;
  model: {
    name: string;
    slug?: string;
    bodyType: string;
    launchLabel?: string;
    loaderSize?: VehicleModel["loaderSize"] | "";
    noOfWheels?: number;
    tags?: string[];
    imageUrl?: string;
    overview?: string;
    pros?: string[];
    cons?: string[];
    faq?: VehicleModel["faq"];
    active: boolean;
    featured: boolean;
  };
  variants: Array<{
    name: string;
    slug?: string;
    exShowroomPrice: number;
    fuelType: VehicleVariant["fuelType"];
    transmission: VehicleVariant["transmission"];
    engineCapacity?: string;
    engineCc?: number;
    maxPowerPs?: number;
    payloadCapacityKg?: number;
    mileage?: string;
    seatingCapacity?: number;
    colors?: string[];
    features?: string[];
    highlights?: string[];
    specifications: Record<string, unknown>;
    specificationGroups?: SpecificationGroup[];
    isDefault?: boolean;
    displayOrder?: number;
    active: boolean;
  }>;
}) {
  const modelSlug = input.model.slug?.trim() || slugify(input.model.name);
  const existingModel = await findModelBySlug(modelSlug);
  const model = existingModel
    ? await updateModel({
        id: existingModel.id,
        brandId: input.brandId,
        categoryId: input.categoryId,
        name: input.model.name,
        slug: modelSlug,
        bodyType: input.model.bodyType,
        launchLabel: input.model.launchLabel,
        loaderSize: input.model.loaderSize,
        noOfWheels: input.model.noOfWheels,
        tags: input.model.tags,
        imageUrl: input.model.imageUrl,
        overview: input.model.overview,
        pros: input.model.pros,
        cons: input.model.cons,
        faq: input.model.faq,
        active: input.model.active,
        featured: input.model.featured,
      })
    : await createModel({
        brandId: input.brandId,
        categoryId: input.categoryId,
        name: input.model.name,
        slug: modelSlug,
        bodyType: input.model.bodyType,
        launchLabel: input.model.launchLabel,
        loaderSize: input.model.loaderSize,
        noOfWheels: input.model.noOfWheels,
        tags: input.model.tags,
        imageUrl: input.model.imageUrl,
        overview: input.model.overview,
        pros: input.model.pros,
        cons: input.model.cons,
        faq: input.model.faq,
        active: input.model.active,
        featured: input.model.featured,
      });

  const createdVariants: VehicleVariant[] = [];

  for (const item of input.variants) {
    const variantSlug = item.slug?.trim() || slugify(item.name);
    const specifications = {
      ...item.specifications,
      colors: item.colors?.length ? item.colors : stringArray(item.specifications.colors),
      features: item.features?.length ? item.features : stringArray(item.specifications.features),
      highlights: item.highlights?.length ? item.highlights : stringArray(item.specifications.highlights),
    };
    const variantInput = {
      name: item.name,
      slug: variantSlug,
      exShowroomPrice: item.exShowroomPrice,
      fuelType: item.fuelType,
      transmission: item.transmission,
      engineCapacity: resolveEngineCapacity({ engineCapacity: item.engineCapacity, fuelType: item.fuelType, specifications }),
      engineCc: item.engineCc,
      maxPowerPs: item.maxPowerPs,
      payloadCapacityKg: item.payloadCapacityKg,
      mileage: resolveMileage({ mileage: item.mileage, specifications }),
      seatingCapacity: item.seatingCapacity ?? 5,
      specifications,
      specificationGroups: item.specificationGroups?.length ? item.specificationGroups : buildSpecificationGroups(specifications),
      isDefault: item.isDefault,
      displayOrder: item.displayOrder,
      active: item.active,
    };
    const existingVariant = await findVariantByModelAndSlug(model.id, variantSlug);

    const variant = existingVariant
      ? await updateVariant({ id: existingVariant.id, modelId: model.id, ...variantInput })
      : await createVariant({ modelId: model.id, ...variantInput, skipCachePrefill: true });

    createdVariants.push(variant);
  }

  // One shared getVehicleDataSet() load for all variants instead of N×7MB from per-variant prefill.
  prefillVariantsPricingCache(createdVariants).catch(() => {});

  revalidatePath("/", "layout");

  return { model, variants: createdVariants };
}

export async function createHomepageBanner(input: {
  placement: "homepage_hero" | "mini_home_banner";
  categoryKey: HeroPromotion["categoryKey"];
  eyebrow?: string;
  headline?: string;
  supportingCopy?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  stat1Label?: string;
  stat1Value?: string;
  stat2Label?: string;
  stat2Value?: string;
  stat3Label?: string;
  stat3Value?: string;
  modelId?: string;
  imageUrl?: string;
  targetUrl?: string;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("hero_promotions")
    .insert({
      placement: input.placement,
      category_key: input.categoryKey,
      eyebrow: optionalText(input.eyebrow),
      headline: optionalText(input.headline),
      supporting_copy: optionalText(input.supportingCopy),
      title: input.title,
      subtitle: optionalText(input.subtitle),
      cta_label: optionalText(input.ctaLabel),
      stat_1_label: optionalText(input.stat1Label),
      stat_1_value: optionalText(input.stat1Value),
      stat_2_label: optionalText(input.stat2Label),
      stat_2_value: optionalText(input.stat2Value),
      stat_3_label: optionalText(input.stat3Label),
      stat_3_value: optionalText(input.stat3Value),
      model_id: input.modelId || null,
      image_url: input.imageUrl || "",
      target_url: input.targetUrl || "",
      active: input.active,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/homepage-banners");
  return mapHeroPromotion(data as DbRow);
}

export async function updateHomepageBanner(input: {
  id: string;
  placement?: "homepage_hero" | "mini_home_banner";
  categoryKey?: HeroPromotion["categoryKey"];
  eyebrow?: string;
  headline?: string;
  supportingCopy?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  stat1Label?: string;
  stat1Value?: string;
  stat2Label?: string;
  stat2Value?: string;
  stat3Label?: string;
  stat3Value?: string;
  modelId?: string;
  imageUrl?: string;
  targetUrl?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.placement !== undefined) patch.placement = input.placement;
  if (input.categoryKey !== undefined) patch.category_key = input.categoryKey;
  if (input.eyebrow !== undefined) patch.eyebrow = optionalText(input.eyebrow);
  if (input.headline !== undefined) patch.headline = optionalText(input.headline);
  if (input.supportingCopy !== undefined) patch.supporting_copy = optionalText(input.supportingCopy);
  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = optionalText(input.subtitle);
  if (input.ctaLabel !== undefined) patch.cta_label = optionalText(input.ctaLabel);
  if (input.stat1Label !== undefined) patch.stat_1_label = optionalText(input.stat1Label);
  if (input.stat1Value !== undefined) patch.stat_1_value = optionalText(input.stat1Value);
  if (input.stat2Label !== undefined) patch.stat_2_label = optionalText(input.stat2Label);
  if (input.stat2Value !== undefined) patch.stat_2_value = optionalText(input.stat2Value);
  if (input.stat3Label !== undefined) patch.stat_3_label = optionalText(input.stat3Label);
  if (input.stat3Value !== undefined) patch.stat_3_value = optionalText(input.stat3Value);
  if (input.modelId !== undefined) patch.model_id = input.modelId || null;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.targetUrl !== undefined) patch.target_url = input.targetUrl;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("hero_promotions").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/homepage-banners");
  return mapHeroPromotion(data as DbRow);
}

export async function createCityPage(input: {
  cityId: string;
  slug: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  body?: string;
  heroImageUrl?: string;
  featuredCategoryId?: string;
  featuredBrandIds?: string[];
  faq?: CityPage["faq"];
  showInFooter: boolean;
  displayOrder: number;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("city_pages")
    .insert({
      city_id: input.cityId,
      slug: input.slug.trim() || slugify(input.title),
      title: input.title,
      h1: input.h1,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      intro: input.intro,
      body: input.body ?? "",
      hero_image_url: optionalText(input.heroImageUrl),
      featured_category_id: optionalText(input.featuredCategoryId),
      featured_brand_ids: arrayFromText(input.featuredBrandIds),
      faq: input.faq ?? [],
      show_in_footer: input.showInFooter,
      display_order: input.displayOrder,
      active: input.active,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/city-pages");
  revalidatePath(`/city/${input.slug}`);
  return mapCityPage(data as DbRow);
}

export async function updateCityPage(input: {
  id: string;
  cityId?: string;
  slug?: string;
  title?: string;
  h1?: string;
  metaTitle?: string;
  metaDescription?: string;
  intro?: string;
  body?: string;
  heroImageUrl?: string;
  featuredCategoryId?: string;
  featuredBrandIds?: string[];
  faq?: CityPage["faq"];
  showInFooter?: boolean;
  displayOrder?: number;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = { updated_at: new Date().toISOString() };

  if (input.cityId !== undefined) patch.city_id = input.cityId;
  if (input.slug !== undefined) patch.slug = input.slug.trim();
  if (input.title !== undefined) patch.title = input.title;
  if (input.h1 !== undefined) patch.h1 = input.h1;
  if (input.metaTitle !== undefined) patch.meta_title = input.metaTitle;
  if (input.metaDescription !== undefined) patch.meta_description = input.metaDescription;
  if (input.intro !== undefined) patch.intro = input.intro;
  if (input.body !== undefined) patch.body = input.body;
  if (input.heroImageUrl !== undefined) patch.hero_image_url = optionalText(input.heroImageUrl);
  if (input.featuredCategoryId !== undefined) patch.featured_category_id = optionalText(input.featuredCategoryId);
  if (input.featuredBrandIds !== undefined) patch.featured_brand_ids = arrayFromText(input.featuredBrandIds);
  if (input.faq !== undefined) patch.faq = input.faq;
  if (input.showInFooter !== undefined) patch.show_in_footer = input.showInFooter;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("city_pages").update(patch).eq("id", input.id).select("*").single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/city-pages");
  revalidatePath(`/city/${String((data as DbRow).slug)}`);
  return mapCityPage(data as DbRow);
}

export async function deleteCityPage(id: string) {
  const supabase = getAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("city_pages")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const { error } = await supabase.from("city_pages").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/city-pages");
  if (existing && typeof existing.slug === "string") revalidatePath(`/city/${existing.slug}`);
  return { id };
}

export async function createTaxRule(input: {
  stateId: string;
  categoryId: string;
  fuelType?: string;
  minPrice: number;
  maxPrice?: number;
  roadTaxPercent: number;
  fixedTaxAmount: number;
  evExemptionPercent: number;
  luxuryCessPercent: number;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("state_tax_rules")
    .insert({
      state_id: input.stateId,
      category_id: input.categoryId,
      fuel_type: optionalText(input.fuelType),
      min_price: input.minPrice,
      max_price: input.maxPrice ?? null,
      road_tax_percent: input.roadTaxPercent,
      fixed_tax_amount: input.fixedTaxAmount,
      ev_exemption_percent: input.evExemptionPercent,
      luxury_cess_percent: input.luxuryCessPercent,
      active: input.active,
    })
    .select("*")
    .single();

  if (error) throw error;
  invalidateCacheForState(input.stateId).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/admin/tax-rules");
  return mapTaxRule(data as DbRow);
}

export async function updateTaxRule(input: {
  id: string;
  stateId?: string;
  categoryId?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  roadTaxPercent?: number;
  fixedTaxAmount?: number;
  evExemptionPercent?: number;
  luxuryCessPercent?: number;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};
  if (input.stateId !== undefined) patch.state_id = input.stateId;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.fuelType !== undefined) patch.fuel_type = optionalText(input.fuelType);
  if (input.minPrice !== undefined) patch.min_price = input.minPrice;
  if (input.maxPrice !== undefined) patch.max_price = input.maxPrice;
  if (input.roadTaxPercent !== undefined) patch.road_tax_percent = input.roadTaxPercent;
  if (input.fixedTaxAmount !== undefined) patch.fixed_tax_amount = input.fixedTaxAmount;
  if (input.evExemptionPercent !== undefined) patch.ev_exemption_percent = input.evExemptionPercent;
  if (input.luxuryCessPercent !== undefined) patch.luxury_cess_percent = input.luxuryCessPercent;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("state_tax_rules").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  const stateId = input.stateId ?? String((data as DbRow).state_id);
  invalidateCacheForState(stateId).catch(() => {});
  revalidatePath("/admin");
  revalidatePath("/admin/tax-rules");
  return mapTaxRule(data as DbRow);
}

export async function createRtoCharge(input: {
  stateId: string;
  cityId: string;
  rtoId?: string;
  registrationFee: number;
  smartCardFee: number;
  numberPlateFee: number;
  hypothecationFee: number;
  fastagFee: number;
  handlingCharges: number;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("rto_charges")
    .insert({
      state_id: input.stateId,
      city_id: input.cityId,
      rto_id: optionalText(input.rtoId),
      registration_fee: input.registrationFee,
      smart_card_fee: input.smartCardFee,
      number_plate_fee: input.numberPlateFee,
      hypothecation_fee: input.hypothecationFee,
      fastag_fee: input.fastagFee,
      handling_charges: input.handlingCharges,
      active: input.active,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/rto-charges");
  return mapRtoCharge(data as DbRow);
}

export async function updateRtoCharge(input: {
  id: string;
  stateId?: string;
  cityId?: string;
  rtoId?: string;
  registrationFee?: number;
  smartCardFee?: number;
  numberPlateFee?: number;
  hypothecationFee?: number;
  fastagFee?: number;
  handlingCharges?: number;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};
  if (input.stateId !== undefined) patch.state_id = input.stateId;
  if (input.cityId !== undefined) patch.city_id = input.cityId;
  if (input.rtoId !== undefined) patch.rto_id = optionalText(input.rtoId);
  if (input.registrationFee !== undefined) patch.registration_fee = input.registrationFee;
  if (input.smartCardFee !== undefined) patch.smart_card_fee = input.smartCardFee;
  if (input.numberPlateFee !== undefined) patch.number_plate_fee = input.numberPlateFee;
  if (input.hypothecationFee !== undefined) patch.hypothecation_fee = input.hypothecationFee;
  if (input.fastagFee !== undefined) patch.fastag_fee = input.fastagFee;
  if (input.handlingCharges !== undefined) patch.handling_charges = input.handlingCharges;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("rto_charges").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/rto-charges");
  return mapRtoCharge(data as DbRow);
}

function mapInsuranceRule(row: DbRow): InsuranceRule {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    fuelType: typeof row.fuel_type === "string" ? (row.fuel_type as InsuranceRule["fuelType"]) : undefined,
    percentOfExShowroom: Number(row.percent_of_ex_showroom ?? 0),
    fixedAmount: Number(row.fixed_amount ?? 0),
    active: Boolean(row.active),
  };
}

export async function createInsuranceRule(input: {
  categoryId: string;
  fuelType?: string;
  percentOfExShowroom: number;
  fixedAmount: number;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("insurance_rules")
    .insert({
      category_id: input.categoryId,
      fuel_type: optionalText(input.fuelType),
      percent_of_ex_showroom: input.percentOfExShowroom,
      fixed_amount: input.fixedAmount,
      active: input.active,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/insurance");
  return mapInsuranceRule(data as DbRow);
}

export async function updateInsuranceRule(input: {
  id: string;
  categoryId?: string;
  fuelType?: string;
  percentOfExShowroom?: number;
  fixedAmount?: number;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.fuelType !== undefined) patch.fuel_type = optionalText(input.fuelType);
  if (input.percentOfExShowroom !== undefined) patch.percent_of_ex_showroom = input.percentOfExShowroom;
  if (input.fixedAmount !== undefined) patch.fixed_amount = input.fixedAmount;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("insurance_rules").update(patch).eq("id", input.id).select("*").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/insurance");
  return mapInsuranceRule(data as DbRow);
}

function mapCity(row: DbRow): City {
  return {
    id: String(row.id),
    stateId: String(row.state_id),
    name: String(row.name),
    slug: String(row.slug),
    defaultRtoId: String(row.default_rto_id ?? ""),
    tier: typeof row.tier === "string" ? row.tier : undefined,
    isMetro: Boolean(row.is_metro),
    rtoStateCode: typeof row.rto_state_code === "string" ? row.rto_state_code : undefined,
  };
}

export async function createCity(input: {
  stateId: string;
  name: string;
  slug?: string;
  defaultRtoId?: string;
  tier?: string;
  isMetro: boolean;
  rtoStateCode?: string;
}): Promise<City> {
  const supabase = getAdminClient();
  const slug = input.slug?.trim() || slugify(input.name);
  const { data, error } = await supabase
    .from("cities")
    .insert({
      state_id: input.stateId,
      name: input.name.trim(),
      slug,
      default_rto_id: optionalText(input.defaultRtoId) ?? null,
      tier: optionalText(input.tier),
      is_metro: input.isMetro,
      rto_state_code: optionalText(input.rtoStateCode),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/cities");
  return mapCity(data as DbRow);
}

export async function updateCity(input: {
  id: string;
  stateId?: string;
  name?: string;
  slug?: string;
  defaultRtoId?: string;
  tier?: string;
  isMetro?: boolean;
  rtoStateCode?: string;
}): Promise<City> {
  const supabase = getAdminClient();
  const patch: DbRow = {};
  if (input.stateId !== undefined) patch.state_id = input.stateId;
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.slug !== undefined) patch.slug = input.slug.trim() || slugify(input.name ?? "");
  if (input.defaultRtoId !== undefined) patch.default_rto_id = optionalText(input.defaultRtoId) ?? null;
  if (input.tier !== undefined) patch.tier = optionalText(input.tier);
  if (input.isMetro !== undefined) patch.is_metro = input.isMetro;
  if (input.rtoStateCode !== undefined) patch.rto_state_code = optionalText(input.rtoStateCode);

  const { data, error } = await supabase.from("cities").update(patch).eq("id", input.id).select("*").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/cities");
  return mapCity(data as DbRow);
}
