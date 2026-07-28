import { revalidatePath } from "next/cache";
import { rebuildAllCollectionCaches, rebuildCollectionCache } from "@/lib/services/gear-collections-cache";
import { invalidateModelCacheForProduct, upsertCatalogIndexRow } from "@/lib/services/gear-catalog-cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/format";
import type {
  GearCategory,
  GearCollection,
  GearCompatibilityType,
  GearHeroBanner,
  GearHomepageSection,
  GearProduct,
  GearProductVariant,
  Seller,
  VehicleType,
} from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function optionalText(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("vehicle_types").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data as DbRow[]).map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug) }));
}

// Cheap head-count stats for the seller landing page -- real numbers, not
// invented social proof, but count-only queries so it stays light on egress.
export async function getGaadiGearLandingStats(): Promise<{ vehicleModelCount: number; categoryCount: number }> {
  const supabase = getAdminClient();
  const [{ count: vehicleModelCount, error: modelError }, { count: categoryCount, error: categoryError }] = await Promise.all([
    supabase.from("vehicle_models").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("gear_categories").select("id", { count: "exact", head: true }).eq("level", 1).eq("is_active", true),
  ]);
  if (modelError) throw modelError;
  if (categoryError) throw categoryError;
  return { vehicleModelCount: vehicleModelCount ?? 0, categoryCount: categoryCount ?? 0 };
}

// --- Categories ---

function mapGearCategory(row: DbRow): GearCategory {
  return {
    id: String(row.id),
    parentId: typeof row.parent_id === "string" ? row.parent_id : undefined,
    name: String(row.name),
    slug: String(row.slug),
    level: Number(row.level),
    applicableVehicleTypes: Array.isArray(row.applicable_vehicle_types) ? (row.applicable_vehicle_types as string[]) : [],
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    commissionPct: Number(row.commission_pct ?? 7),
  };
}

export async function getGearCategories(): Promise<GearCategory[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_categories")
    .select("*")
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as DbRow[]).map(mapGearCategory);
}

export async function createGearCategory(input: {
  parentId?: string;
  name: string;
  slug?: string;
  level: number;
  applicableVehicleTypes?: string[];
  sortOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
  commissionPct?: number;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_categories")
    .insert({
      parent_id: optionalText(input.parentId),
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      level: input.level,
      applicable_vehicle_types: input.applicableVehicleTypes ?? [],
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      image_url: optionalText(input.imageUrl),
      commission_pct: input.commissionPct ?? 7,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin/gaadigear/categories");
  return mapGearCategory(data as DbRow);
}

export async function updateGearCategory(input: {
  id: string;
  parentId?: string;
  name?: string;
  slug?: string;
  level?: number;
  applicableVehicleTypes?: string[];
  sortOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
  commissionPct?: number;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.parentId !== undefined) patch.parent_id = optionalText(input.parentId);
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.level !== undefined) patch.level = input.level;
  if (input.applicableVehicleTypes !== undefined) patch.applicable_vehicle_types = input.applicableVehicleTypes;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.imageUrl !== undefined) patch.image_url = optionalText(input.imageUrl);
  if (input.commissionPct !== undefined) patch.commission_pct = input.commissionPct;

  const { data, error } = await supabase.from("gear_categories").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/admin/gaadigear/categories");
  return mapGearCategory(data as DbRow);
}

export async function deleteGearCategory(id: string) {
  const supabase = getAdminClient();

  const [{ count: childCount, error: childError }, { count: productCount, error: productError }] = await Promise.all([
    supabase.from("gear_categories").select("id", { count: "exact" }).eq("parent_id", id).limit(0),
    supabase.from("gear_products").select("id", { count: "exact" }).eq("category_id", id).limit(0),
  ]);

  if (childError) throw childError;
  if (productError) throw productError;

  const blockers = [
    childCount ? `${childCount} sub-categor${childCount === 1 ? "y" : "ies"}` : "",
    productCount ? `${productCount} product${productCount === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  if (blockers.length) {
    throw new Error(`Cannot delete category: still referenced by ${blockers.join(" and ")}.`);
  }

  const { error } = await supabase.from("gear_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/gaadigear/categories");
  return true;
}

// --- Sellers ---

function mapSeller(row: DbRow): Seller {
  return {
    id: String(row.id),
    businessName: String(row.business_name),
    brandName: typeof row.brand_name === "string" ? row.brand_name : undefined,
    businessType: typeof row.business_type === "string" ? row.business_type : undefined,
    gstin: typeof row.gstin === "string" ? row.gstin : undefined,
    pan: typeof row.pan === "string" ? row.pan : undefined,
    kycStatus: (row.kyc_status as Seller["kycStatus"]) ?? "pending_review",
    kycRejectionReason: typeof row.kyc_rejection_reason === "string" ? row.kyc_rejection_reason : undefined,
    contactEmail: typeof row.contact_email === "string" ? row.contact_email : undefined,
    contactPhone: typeof row.contact_phone === "string" ? row.contact_phone : undefined,
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : undefined,
    status: (row.status as Seller["status"]) ?? "onboarding",
    commissionPct: Number(row.commission_pct ?? 10),
    createdAt: String(row.created_at),
    emailVerifiedAt: typeof row.email_verified_at === "string" ? row.email_verified_at : undefined,
  };
}

export async function getSellers(filter?: { status?: string }): Promise<Seller[]> {
  const supabase = getAdminClient();
  let query = supabase.from("sellers").select("*").order("created_at", { ascending: false });
  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as DbRow[]).map(mapSeller);
}

export async function approveSeller(id: string) {
  const supabase = getAdminClient();

  const { data: existingRow, error: existingError } = await supabase.from("sellers").select("email_verified_at").eq("id", id).maybeSingle();
  if (existingError) throw existingError;
  if (!(existingRow as DbRow | null)?.email_verified_at) {
    throw new Error("This seller hasn't verified their email yet — they need to click the verification link (or resend it) before you can approve them.");
  }

  const { data, error } = await supabase
    .from("sellers")
    .update({ status: "active", kyc_status: "verified", kyc_rejection_reason: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin/gaadigear/sellers");
  return mapSeller(data as DbRow);
}

export async function rejectSeller(id: string, reason: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sellers")
    .update({ kyc_status: "rejected", kyc_rejection_reason: reason })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin/gaadigear/sellers");
  return mapSeller(data as DbRow);
}

export async function suspendSeller(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("sellers").update({ status: "suspended" }).eq("id", id).select("*").single();
  if (error) throw error;
  revalidatePath("/admin/gaadigear/sellers");
  return mapSeller(data as DbRow);
}

// --- Products (moderation) ---

// Every product's mrp/sellingPrice/stockQty is derived from its variants --
// the cheapest variant's mrp/sellingPrice (matches the "Starting from"
// convention used on the PLP), stockQty summed across all of them. There is
// no product-level price column anymore.
function derivePricing(variants: DbRow[]) {
  const priced = variants.filter((v) => v.selling_price !== null && v.selling_price !== undefined);
  const cheapest = priced.reduce<DbRow | null>(
    (min, v) => (min === null || Number(v.selling_price) < Number(min.selling_price) ? v : min),
    null,
  );
  return {
    mrp: cheapest ? Number(cheapest.mrp) : 0,
    sellingPrice: cheapest ? Number(cheapest.selling_price) : 0,
    stockQty: variants.reduce((sum, v) => sum + Number(v.stock_qty ?? 0), 0),
    hasMultipleVariants: priced.length > 1,
  };
}

function mapGearProduct(row: DbRow, variants: DbRow[]): GearProduct {
  const seller = row.sellers as DbRow | null;
  const category = row.gear_categories as DbRow | null;
  const brand = row.gear_brands as DbRow | null;
  const pricing = derivePricing(variants);

  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    sellerName: seller ? String(seller.business_name) : undefined,
    brandId: typeof row.brand_id === "string" ? row.brand_id : undefined,
    brandName: brand ? String(brand.name) : undefined,
    categoryId: String(row.category_id),
    categoryName: category ? String(category.name) : undefined,
    title: String(row.title),
    slug: String(row.slug),
    description: typeof row.description === "string" ? row.description : undefined,
    mrp: pricing.mrp,
    sellingPrice: pricing.sellingPrice,
    hasMultipleVariants: pricing.hasMultipleVariants,
    gstRate: Number(row.gst_rate),
    hsnCode: typeof row.hsn_code === "string" ? row.hsn_code : undefined,
    stockQty: pricing.stockQty,
    sku: typeof row.sku === "string" ? row.sku : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    usageTags: Array.isArray(row.usage_tags) ? (row.usage_tags as string[]) : [],
    status: (row.status as GearProduct["status"]) ?? "draft",
    rejectionReason: typeof row.rejection_reason === "string" ? row.rejection_reason : undefined,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getGearProducts(filter?: { status?: string; categoryId?: string; sellerId?: string }): Promise<GearProduct[]> {
  const supabase = getAdminClient();
  let query = supabase
    .from("gear_products")
    .select("*, sellers(business_name), gear_categories(name), gear_brands(name)")
    .order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.categoryId) query = query.eq("category_id", filter.categoryId);
  if (filter?.sellerId) query = query.eq("seller_id", filter.sellerId);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data as DbRow[];
  if (rows.length === 0) return [];

  const productIds = rows.map((r) => String(r.id));
  const { data: variantRows, error: variantError } = await supabase
    .from("gear_product_variants")
    .select("product_id, mrp, selling_price, stock_qty")
    .in("product_id", productIds);
  if (variantError) throw variantError;

  const variantsByProduct = new Map<string, DbRow[]>();
  for (const row of (variantRows ?? []) as DbRow[]) {
    const productId = String(row.product_id);
    const list = variantsByProduct.get(productId) ?? [];
    list.push(row);
    variantsByProduct.set(productId, list);
  }

  return rows.map((row) => mapGearProduct(row, variantsByProduct.get(String(row.id)) ?? []));
}

function mapGearProductVariant(row: DbRow): GearProductVariant {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    size: typeof row.size === "string" ? row.size : undefined,
    color: typeof row.color === "string" ? row.color : undefined,
    mrp: Number(row.mrp),
    sellingPrice: Number(row.selling_price),
    stockQty: Number(row.stock_qty ?? 0),
    skuSuffix: typeof row.sku_suffix === "string" ? row.sku_suffix : undefined,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
  };
}

// Full detail for the admin review page -- getGearProducts (list) never
// attaches compatibility/variants since the list view doesn't need it; the
// review page does, so a seller's tagging can actually be checked before
// approving instead of approving blind.
export async function getGearProductDetail(id: string): Promise<{ product: GearProduct; variants: GearProductVariant[] } | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select("*, sellers(business_name), gear_categories(name), gear_brands(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [{ data: compatRows, error: compatError }, { data: variantRows, error: variantError }] = await Promise.all([
    supabase.from("gear_product_compatibility").select("*").eq("product_id", id),
    supabase.from("gear_product_variants").select("*").eq("product_id", id),
  ]);
  if (compatError) throw compatError;
  if (variantError) throw variantError;

  const compatibility = (compatRows as DbRow[]).map((row) => ({
    id: String(row.id),
    compatibilityType: row.compatibility_type as GearCompatibilityType,
    vehicleTypeId: typeof row.vehicle_type_id === "string" ? row.vehicle_type_id : undefined,
    segment: typeof row.segment === "string" ? row.segment : undefined,
    vehicleBrandId: typeof row.vehicle_brand_id === "string" ? row.vehicle_brand_id : undefined,
    vehicleModelId: typeof row.vehicle_model_id === "string" ? row.vehicle_model_id : undefined,
    vehicleVariantId: typeof row.vehicle_variant_id === "string" ? row.vehicle_variant_id : undefined,
  }));

  const variantRowsList = variantRows as DbRow[];
  return {
    product: { ...mapGearProduct(data as DbRow, variantRowsList), compatibility },
    variants: variantRowsList.map(mapGearProductVariant),
  };
}

export async function approveGearProduct(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .update({ status: "live", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, sellers(business_name), gear_categories(name), gear_brands(name)")
    .single();

  if (error) throw error;
  await upsertCatalogIndexRow(id).catch(() => {});
  await invalidateModelCacheForProduct(id).catch(() => {});
  revalidatePath("/admin/gaadigear/products");
  const { data: variantRows } = await supabase.from("gear_product_variants").select("mrp, selling_price, stock_qty").eq("product_id", id);
  return mapGearProduct(data as DbRow, (variantRows ?? []) as DbRow[]);
}

export async function rejectGearProduct(id: string, reason: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, sellers(business_name), gear_categories(name), gear_brands(name)")
    .single();

  if (error) throw error;
  await upsertCatalogIndexRow(id).catch(() => {});
  await invalidateModelCacheForProduct(id).catch(() => {});
  revalidatePath("/admin/gaadigear/products");
  const { data: variantRows } = await supabase.from("gear_product_variants").select("mrp, selling_price, stock_qty").eq("product_id", id);
  return mapGearProduct(data as DbRow, (variantRows ?? []) as DbRow[]);
}

// Admin-side equivalent of the seller's setProductPaused: hides a live product
// from every buyer-facing surface (every public read filters status='live')
// without deleting it, and un-hides it again -- an alternative to rejecting
// when a listing needs to come down temporarily (stock issue, a policy check,
// a seller dispute) rather than being sent back for edits.
export async function setGearProductPaused(id: string, paused: boolean) {
  const supabase = getAdminClient();
  const { data: existing, error: existingError } = await supabase.from("gear_products").select("status").eq("id", id).maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("Product not found");
  const currentStatus = String((existing as DbRow).status);
  if (paused && currentStatus !== "live") throw new Error("Only a live product can be paused");
  if (!paused && currentStatus !== "paused") throw new Error("Only a paused product can be resumed");

  const { data, error } = await supabase
    .from("gear_products")
    .update({ status: paused ? "paused" : "live", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, sellers(business_name), gear_categories(name), gear_brands(name)")
    .single();

  if (error) throw error;
  await upsertCatalogIndexRow(id).catch(() => {});
  await invalidateModelCacheForProduct(id).catch(() => {});
  revalidatePath("/admin/gaadigear/products");
  const { data: variantRows } = await supabase.from("gear_product_variants").select("mrp, selling_price, stock_qty").eq("product_id", id);
  return mapGearProduct(data as DbRow, (variantRows ?? []) as DbRow[]);
}

// --- Collections ---

function mapGearCollection(row: DbRow, productIds: string[] = []): GearCollection {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: typeof row.description === "string" ? row.description : undefined,
    type: String(row.type) as GearCollection["type"],
    bannerImage: typeof row.banner_image === "string" ? row.banner_image : undefined,
    icon: typeof row.icon === "string" ? row.icon : undefined,
    priority: Number(row.priority ?? 0),
    isActive: Boolean(row.is_active),
    maxProducts: Number(row.max_products ?? 12),
    conditions: (row.conditions as Record<string, unknown>) ?? {},
    startAt: typeof row.start_at === "string" ? row.start_at : undefined,
    endAt: typeof row.end_at === "string" ? row.end_at : undefined,
    productIds,
  };
}

export async function getGearCollections(): Promise<GearCollection[]> {
  const supabase = getAdminClient();
  const [{ data: collections, error }, { data: picks, error: picksError }] = await Promise.all([
    supabase.from("gear_collections").select("*").order("priority", { ascending: false }).order("name", { ascending: true }),
    supabase.from("gear_collection_products").select("collection_id, product_id, sort_order").order("sort_order", { ascending: true }),
  ]);
  if (error) throw error;
  if (picksError) throw picksError;

  const productIdsByCollection = new Map<string, string[]>();
  for (const pick of (picks ?? []) as DbRow[]) {
    const collectionId = String(pick.collection_id);
    const list = productIdsByCollection.get(collectionId) ?? [];
    list.push(String(pick.product_id));
    productIdsByCollection.set(collectionId, list);
  }

  return ((collections ?? []) as DbRow[]).map((row) => mapGearCollection(row, productIdsByCollection.get(String(row.id)) ?? []));
}

type GearCollectionInput = {
  name: string;
  slug?: string;
  description?: string;
  type: string;
  bannerImage?: string;
  icon?: string;
  priority?: number;
  isActive?: boolean;
  maxProducts?: number;
  conditions?: Record<string, unknown>;
  startAt?: string;
  endAt?: string;
  productIds?: string[]; // manual/brand/category: full ordered replacement list
};

async function setCollectionProducts(collectionId: string, productIds: string[]) {
  const supabase = getAdminClient();
  const { error: deleteError } = await supabase.from("gear_collection_products").delete().eq("collection_id", collectionId);
  if (deleteError) throw deleteError;
  if (productIds.length === 0) return;

  const rows = productIds.map((productId, index) => ({ collection_id: collectionId, product_id: productId, sort_order: index }));
  const { error: insertError } = await supabase.from("gear_collection_products").insert(rows);
  if (insertError) throw insertError;
}

export async function createGearCollection(input: GearCollectionInput) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_collections")
    .insert({
      name: input.name,
      slug: input.slug?.trim() || slugify(input.name),
      description: optionalText(input.description),
      type: input.type,
      banner_image: optionalText(input.bannerImage),
      icon: optionalText(input.icon),
      priority: input.priority ?? 0,
      is_active: input.isActive ?? true,
      max_products: input.maxProducts ?? 12,
      conditions: input.conditions ?? {},
      start_at: input.startAt || null,
      end_at: input.endAt || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  const collection = data as DbRow;
  if (input.productIds?.length) await setCollectionProducts(String(collection.id), input.productIds);
  await rebuildCollectionCache(String(collection.id)).catch(() => {});
  revalidatePath("/admin/gaadigear/collections");
  return mapGearCollection(collection, input.productIds ?? []);
}

export async function updateGearCollection(input: Partial<GearCollectionInput> & { id: string }) {
  const supabase = getAdminClient();
  const patch: DbRow = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || (input.name ? slugify(input.name) : undefined);
  if (input.description !== undefined) patch.description = optionalText(input.description);
  if (input.type !== undefined) patch.type = input.type;
  if (input.bannerImage !== undefined) patch.banner_image = optionalText(input.bannerImage);
  if (input.icon !== undefined) patch.icon = optionalText(input.icon);
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.maxProducts !== undefined) patch.max_products = input.maxProducts;
  if (input.conditions !== undefined) patch.conditions = input.conditions;
  if (input.startAt !== undefined) patch.start_at = input.startAt || null;
  if (input.endAt !== undefined) patch.end_at = input.endAt || null;

  const { data, error } = await supabase.from("gear_collections").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;

  if (input.productIds !== undefined) await setCollectionProducts(input.id, input.productIds);
  await rebuildCollectionCache(input.id).catch(() => {});
  revalidatePath("/admin/gaadigear/collections");
  return mapGearCollection(data as DbRow, input.productIds ?? []);
}

export async function deleteGearCollection(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("gear_collections").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  return true;
}

export async function refreshGearCollectionCache(id: string) {
  return rebuildCollectionCache(id);
}

export async function refreshAllGearCollectionCaches() {
  return rebuildAllCollectionCaches();
}

// --- Homepage sections ---

function mapHomepageSection(row: DbRow): GearHomepageSection {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
    collectionId: typeof row.collection_id === "string" ? row.collection_id : undefined,
    displayStyle: String(row.display_style ?? "carousel") as GearHomepageSection["displayStyle"],
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
  };
}

export async function getGearHomepageSections(): Promise<GearHomepageSection[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("gear_homepage_sections").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbRow[]).map(mapHomepageSection);
}

export async function createGearHomepageSection(input: {
  title: string;
  subtitle?: string;
  collectionId?: string;
  displayStyle: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_homepage_sections")
    .insert({
      title: input.title,
      subtitle: optionalText(input.subtitle),
      collection_id: input.collectionId || null,
      display_style: input.displayStyle,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  return mapHomepageSection(data as DbRow);
}

export async function updateGearHomepageSection(input: {
  id: string;
  title?: string;
  subtitle?: string;
  collectionId?: string;
  displayStyle?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = optionalText(input.subtitle);
  if (input.collectionId !== undefined) patch.collection_id = input.collectionId || null;
  if (input.displayStyle !== undefined) patch.display_style = input.displayStyle;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  const { data, error } = await supabase.from("gear_homepage_sections").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  return mapHomepageSection(data as DbRow);
}

export async function deleteGearHomepageSection(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("gear_homepage_sections").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  return true;
}

// --- Hero banner ---

function mapHeroBanner(row: DbRow): GearHeroBanner {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    ctaLabel: String(row.cta_label ?? "Shop now"),
    ctaHref: String(row.cta_href ?? "/gaadigear/products"),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function getGearHeroBanners(): Promise<GearHeroBanner[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("gear_hero_banners").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbRow[]).map(mapHeroBanner);
}

export async function createGearHeroBanner(input: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_hero_banners")
    .insert({
      title: input.title,
      subtitle: optionalText(input.subtitle),
      image_url: optionalText(input.imageUrl),
      cta_label: input.ctaLabel || "Shop now",
      cta_href: input.ctaHref || "/gaadigear/products",
      is_active: input.isActive ?? true,
      sort_order: input.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  revalidatePath("/gaadigear");
  return mapHeroBanner(data as DbRow);
}

export async function updateGearHeroBanner(input: {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) patch.title = input.title;
  if (input.subtitle !== undefined) patch.subtitle = optionalText(input.subtitle);
  if (input.imageUrl !== undefined) patch.image_url = optionalText(input.imageUrl);
  if (input.ctaLabel !== undefined) patch.cta_label = input.ctaLabel || "Shop now";
  if (input.ctaHref !== undefined) patch.cta_href = input.ctaHref || "/gaadigear/products";
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

  const { data, error } = await supabase.from("gear_hero_banners").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  revalidatePath("/gaadigear");
  return mapHeroBanner(data as DbRow);
}

export async function deleteGearHeroBanner(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("gear_hero_banners").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/gaadigear/collections");
  revalidatePath("/gaadigear");
  return true;
}
