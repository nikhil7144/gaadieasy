import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/format";
import type {
  Brand,
  Dealer,
  DealerBrandMapping,
  DealerBusiness,
  DealerUser,
  HeroPromotion,
  SpecificationGroup,
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
    overview: typeof row.overview === "string" ? row.overview : undefined,
    pros: Array.isArray(row.pros) ? (row.pros as string[]) : [],
    cons: Array.isArray(row.cons) ? (row.cons as string[]) : [],
    faq: Array.isArray(row.faq) ? (row.faq as VehicleModel["faq"]) : [],
    active: Boolean(row.active),
    featured: Boolean(row.featured),
  };
}

function mapHeroPromotion(row: DbRow): HeroPromotion {
  return {
    id: String(row.id),
    placement: typeof row.placement === "string" ? (row.placement as HeroPromotion["placement"]) : "homepage_hero",
    eyebrow: typeof row.eyebrow === "string" ? row.eyebrow : undefined,
    title: String(row.title),
    subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
    ctaLabel: typeof row.cta_label === "string" ? row.cta_label : undefined,
    imageUrl: String(row.image_url),
    categoryKey: String(row.category_key) as HeroPromotion["categoryKey"],
    brandId: typeof row.brand_id === "string" ? row.brand_id : undefined,
    modelId: typeof row.model_id === "string" ? row.model_id : undefined,
    variantId: typeof row.variant_id === "string" ? row.variant_id : undefined,
    targetUrl: String(row.target_url),
    active: Boolean(row.active),
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
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
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
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.logoUrl !== undefined) patch.logo_url = optionalText(input.logoUrl);
  if (input.categoryIds !== undefined) patch.category_ids = arrayFromText(input.categoryIds);
  if (input.active !== undefined) patch.active = input.active;
  if (input.featured !== undefined) patch.featured = input.featured;

  const { data, error } = await supabase.from("brands").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
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

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/brands");

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
  loaderSize?: VehicleModel["loaderSize"] | "";
  imageUrl?: string;
  overview?: string;
  pros?: string[];
  cons?: string[];
  faq?: VehicleModel["faq"];
  active: boolean;
  featured: boolean;
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
      loader_size: optionalText(input.loaderSize),
      image_url: optionalText(input.imageUrl),
      overview: optionalText(input.overview),
      pros: arrayFromText(input.pros),
      cons: arrayFromText(input.cons),
      faq: Array.isArray(input.faq) ? input.faq : [],
      active: input.active,
      featured: input.featured,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/admin/variants");
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
  if (input.loaderSize !== undefined) patch.loader_size = optionalText(input.loaderSize);
  if (input.imageUrl !== undefined) patch.image_url = optionalText(input.imageUrl);
  if (input.overview !== undefined) patch.overview = optionalText(input.overview);
  if (input.pros !== undefined) patch.pros = arrayFromText(input.pros);
  if (input.cons !== undefined) patch.cons = arrayFromText(input.cons);
  if (input.faq !== undefined) patch.faq = Array.isArray(input.faq) ? input.faq : [];
  if (input.active !== undefined) patch.active = input.active;
  if (input.featured !== undefined) patch.featured = input.featured;

  const { data, error } = await supabase.from("vehicle_models").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/admin/variants");
  return mapModel(data as DbRow);
}

export async function createVariant(input: {
  modelId: string;
  name: string;
  slug?: string;
  exShowroomPrice: number;
  fuelType: VehicleVariant["fuelType"];
  transmission: VehicleVariant["transmission"];
  engineCapacity: string;
  mileage: string;
  seatingCapacity: number;
  specifications: Record<string, unknown>;
  specificationGroups: VehicleVariant["specificationGroups"];
  isDefault?: boolean;
  displayOrder?: number;
  active: boolean;
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
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/variants");
  return mapVariant(data as DbRow);
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
  if (input.mileage !== undefined) patch.mileage = input.mileage;
  if (input.seatingCapacity !== undefined) patch.seating_capacity = input.seatingCapacity;
  if (input.specifications !== undefined) patch.specifications = input.specifications;
  if (input.specificationGroups !== undefined) patch.specification_groups = input.specificationGroups;
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;
  if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("vehicle_variants").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/variants");
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
    supabase.from("vehicle_leads").select("id", { count: "exact", head: true }).eq("variant_id", id),
    supabase.from("comparison_pages").select("id", { count: "exact", head: true }).eq("vehicle_1_variant_id", id),
    supabase.from("comparison_pages").select("id", { count: "exact", head: true }).eq("vehicle_2_variant_id", id),
    supabase.from("comparison_pages").select("id", { count: "exact", head: true }).eq("vehicle_3_variant_id", id),
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

  const { error } = await supabase.from("vehicle_variants").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/variants");

  return { id };
}

export async function createModelWithVariants(input: {
  brandId: string;
  categoryId: string;
  model: {
    name: string;
    slug?: string;
    bodyType: string;
    loaderSize?: VehicleModel["loaderSize"] | "";
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
        loaderSize: input.model.loaderSize,
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
        loaderSize: input.model.loaderSize,
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
      : await createVariant({ modelId: model.id, ...variantInput });

    createdVariants.push(variant);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/admin/variants");

  return { model, variants: createdVariants };
}

export async function createHomepageBanner(input: {
  placement: "homepage_hero" | "mini_home_banner";
  categoryKey: HeroPromotion["categoryKey"];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  imageUrl: string;
  targetUrl: string;
  active: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("hero_promotions")
    .insert({
      placement: input.placement,
      category_key: input.categoryKey,
      eyebrow: optionalText(input.eyebrow),
      title: input.title,
      subtitle: optionalText(input.subtitle),
      cta_label: optionalText(input.ctaLabel),
      image_url: input.imageUrl,
      target_url: input.targetUrl,
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
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  imageUrl?: string;
  targetUrl?: string;
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.placement !== undefined) patch.placement = input.placement;
  if (input.categoryKey !== undefined) patch.category_key = input.categoryKey;
  if (input.eyebrow !== undefined) patch.eyebrow = optionalText(input.eyebrow);
  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = optionalText(input.subtitle);
  if (input.ctaLabel !== undefined) patch.cta_label = optionalText(input.ctaLabel);
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
