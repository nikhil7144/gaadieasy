import { invalidateModelCacheForProduct, upsertCatalogIndexRow } from "@/lib/services/gear-catalog-cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils/format";
import type { GearProduct, GearProductCompatibilityRow } from "@/types/automobile";

async function refreshCache(productId: string) {
  await upsertCatalogIndexRow(productId).catch(() => {});
  await invalidateModelCacheForProduct(productId).catch(() => {});
}

type DbRow = Record<string, unknown>;

export type SellerProductCompatibilityInput = {
  compatibilityType: "global" | "vehicle_type" | "segment" | "brand" | "model" | "variant";
  vehicleTypeId?: string;
  segment?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleVariantId?: string;
};

// Product-level fields only -- there is no product-level price. Every
// product always has >= 1 variant (see createProductForSeller), and price/
// stock live there exclusively.
export type SellerProductInput = {
  brandId?: string;
  categoryId: string;
  title: string;
  slug?: string;
  description?: string;
  gstRate?: number;
  hsnCode?: string;
  sku?: string;
  images?: string[];
  usageTags?: string[];
  compatibility: SellerProductCompatibilityInput[];
};

export type SellerProductCreateInput = SellerProductInput & {
  defaultVariant: {
    size?: string;
    color?: string;
    mrp: number;
    sellingPrice: number;
    stockQty?: number;
  };
};

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function str(row: DbRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function optionalStr(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function num(row: DbRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

// Every product's displayed mrp/sellingPrice/stockQty is derived from its
// variants -- the cheapest variant's mrp/sellingPrice (matches the "Starting
// from" convention used on the PLP/catalog cache), stockQty summed across all
// of them. A product with no variants yet (mid-creation edge case) shows 0s.
function derivePricing(variants: DbRow[]) {
  const priced = variants.filter((v) => v.selling_price !== null && v.selling_price !== undefined);
  const cheapest = priced.reduce<DbRow | null>(
    (min, v) => (min === null || num(v, "selling_price") < num(min, "selling_price") ? v : min),
    null,
  );
  return {
    mrp: cheapest ? num(cheapest, "mrp") : 0,
    sellingPrice: cheapest ? num(cheapest, "selling_price") : 0,
    stockQty: variants.reduce((sum, v) => sum + num(v, "stock_qty"), 0),
    hasMultipleVariants: priced.length > 1,
  };
}

function mapGearProduct(row: DbRow, variants: DbRow[]): GearProduct {
  const category = row.gear_categories as DbRow | null;
  const brand = row.gear_brands as DbRow | null;
  const pricing = derivePricing(variants);

  return {
    id: str(row, "id"),
    sellerId: str(row, "seller_id"),
    brandId: optionalStr(row, "brand_id"),
    brandName: brand ? str(brand, "name") : undefined,
    categoryId: str(row, "category_id"),
    categoryName: category ? str(category, "name") : undefined,
    title: str(row, "title"),
    slug: str(row, "slug"),
    description: optionalStr(row, "description"),
    mrp: pricing.mrp,
    sellingPrice: pricing.sellingPrice,
    hasMultipleVariants: pricing.hasMultipleVariants,
    gstRate: num(row, "gst_rate", 18),
    hsnCode: optionalStr(row, "hsn_code"),
    stockQty: pricing.stockQty,
    sku: optionalStr(row, "sku"),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    usageTags: Array.isArray(row.usage_tags) ? (row.usage_tags as string[]) : [],
    status: (row.status as GearProduct["status"]) ?? "draft",
    rejectionReason: optionalStr(row, "rejection_reason"),
    ratingAvg: num(row, "rating_avg"),
    ratingCount: num(row, "rating_count"),
    createdAt: str(row, "created_at"),
    updatedAt: str(row, "updated_at"),
  };
}

const PRODUCT_SELECT = "*, gear_categories(name), gear_brands(name)";

function mapCompatibilityRow(row: DbRow): GearProductCompatibilityRow {
  return {
    id: str(row, "id"),
    compatibilityType: row.compatibility_type as GearProductCompatibilityRow["compatibilityType"],
    vehicleTypeId: optionalStr(row, "vehicle_type_id"),
    segment: optionalStr(row, "segment"),
    vehicleBrandId: optionalStr(row, "vehicle_brand_id"),
    vehicleModelId: optionalStr(row, "vehicle_model_id"),
    vehicleVariantId: optionalStr(row, "vehicle_variant_id"),
  };
}

export async function getProductsForSeller(sellerId: string): Promise<GearProduct[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = data as DbRow[];
  if (rows.length === 0) return [];

  const productIds = rows.map((r) => str(r, "id"));
  const [{ data: compatRows, error: compatError }, { data: variantRows, error: variantError }] = await Promise.all([
    supabase.from("gear_product_compatibility").select("*").in("product_id", productIds),
    supabase.from("gear_product_variants").select("product_id, mrp, selling_price, stock_qty").in("product_id", productIds),
  ]);
  if (compatError) throw compatError;
  if (variantError) throw variantError;

  const compatByProduct = new Map<string, GearProductCompatibilityRow[]>();
  for (const row of (compatRows ?? []) as DbRow[]) {
    const productId = str(row, "product_id");
    const list = compatByProduct.get(productId) ?? [];
    list.push(mapCompatibilityRow(row));
    compatByProduct.set(productId, list);
  }

  const variantsByProduct = new Map<string, DbRow[]>();
  for (const row of (variantRows ?? []) as DbRow[]) {
    const productId = str(row, "product_id");
    const list = variantsByProduct.get(productId) ?? [];
    list.push(row);
    variantsByProduct.set(productId, list);
  }

  return rows.map((row) => {
    const id = str(row, "id");
    return { ...mapGearProduct(row, variantsByProduct.get(id) ?? []), compatibility: compatByProduct.get(id) ?? [] };
  });
}

export async function getProductForSeller(sellerId: string, productId: string): Promise<GearProduct | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [{ data: compatRows, error: compatError }, { data: variantRows, error: variantError }] = await Promise.all([
    supabase.from("gear_product_compatibility").select("*").eq("product_id", productId),
    supabase.from("gear_product_variants").select("mrp, selling_price, stock_qty").eq("product_id", productId),
  ]);
  if (compatError) throw compatError;
  if (variantError) throw variantError;

  return {
    ...mapGearProduct(data as DbRow, (variantRows ?? []) as DbRow[]),
    compatibility: (compatRows as DbRow[]).map(mapCompatibilityRow),
  };
}

async function replaceCompatibility(productId: string, compatibility: SellerProductCompatibilityInput[]) {
  const supabase = getAdminClient();
  const { error: deleteError } = await supabase.from("gear_product_compatibility").delete().eq("product_id", productId);
  if (deleteError) throw deleteError;

  const rows = compatibility.map((c) => ({
    product_id: productId,
    compatibility_type: c.compatibilityType,
    vehicle_type_id: c.vehicleTypeId || null,
    segment: c.segment || null,
    vehicle_brand_id: c.vehicleBrandId || null,
    vehicle_model_id: c.vehicleModelId || null,
    vehicle_variant_id: c.vehicleVariantId || null,
  }));

  const { error: insertError } = await supabase.from("gear_product_compatibility").insert(rows);
  if (insertError) throw insertError;
}

// Bootstraps the product's mandatory first variant -- a product can't exist
// with zero variants, so this always runs as part of creation, not through
// the general createProductVariant path (which requires an already-owned
// product and enforces the 2-image rule that doesn't apply yet here -- no
// photos have been picked at this point in the wizard).
async function insertDefaultVariant(productId: string, input: SellerProductCreateInput["defaultVariant"]) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("gear_product_variants").insert({
    product_id: productId,
    size: input.size || null,
    color: input.color || null,
    mrp: input.mrp,
    selling_price: input.sellingPrice,
    stock_qty: input.stockQty ?? 0,
    images: [],
  });
  if (error) throw error;
}

export async function createProductForSeller(sellerId: string, input: SellerProductCreateInput): Promise<GearProduct> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_products")
    .insert({
      seller_id: sellerId,
      brand_id: input.brandId || null,
      category_id: input.categoryId,
      title: input.title,
      slug: input.slug?.trim() || slugify(input.title),
      description: input.description || null,
      gst_rate: input.gstRate ?? 18,
      hsn_code: input.hsnCode || null,
      sku: input.sku || null,
      images: input.images ?? [],
      usage_tags: input.usageTags ?? [],
      status: "draft",
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  const product = data as DbRow;
  const productId = str(product, "id");

  await insertDefaultVariant(productId, input.defaultVariant);
  await replaceCompatibility(productId, input.compatibility);
  await refreshCache(productId);

  const created = await getProductForSeller(sellerId, productId);
  if (!created) throw new Error("Product created but could not be reloaded");
  return created;
}

export async function updateProductForSeller(sellerId: string, productId: string, input: Partial<SellerProductInput>): Promise<GearProduct> {
  const supabase = getAdminClient();
  const existing = await getProductForSeller(sellerId, productId);
  if (!existing) throw new Error("Product not found for this seller");

  const patch: DbRow = { updated_at: new Date().toISOString() };
  if (input.brandId !== undefined) patch.brand_id = input.brandId || null;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.title !== undefined) patch.title = input.title;
  if (input.slug !== undefined) patch.slug = input.slug.trim() || slugify(input.title ?? existing.title);
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.gstRate !== undefined) patch.gst_rate = input.gstRate;
  if (input.hsnCode !== undefined) patch.hsn_code = input.hsnCode || null;
  if (input.sku !== undefined) patch.sku = input.sku || null;
  if (input.images !== undefined) patch.images = input.images;
  if (input.usageTags !== undefined) patch.usage_tags = input.usageTags;

  const { error } = await supabase.from("gear_products").update(patch).eq("id", productId).eq("seller_id", sellerId);
  if (error) throw error;

  if (input.compatibility) await replaceCompatibility(productId, input.compatibility);
  await refreshCache(productId);

  const updated = await getProductForSeller(sellerId, productId);
  if (!updated) throw new Error("Product updated but could not be reloaded");
  return updated;
}

// Auto-approved: every required field is already enforced at creation time
// (title, category, compatibility, default variant's mrp/selling price)
// except photos, which are optional until publish. So "is this product
// complete enough to go live" reduces to a single check here -- no manual
// admin review step.
export async function publishProduct(sellerId: string, productId: string): Promise<GearProduct> {
  const supabase = getAdminClient();
  const existing = await getProductForSeller(sellerId, productId);
  if (!existing) throw new Error("Product not found for this seller");
  // pending_review is included so a product that reached that status before
  // the auto-publish switchover (or via manual admin intervention) isn't
  // stuck waiting on an admin who no longer needs to be in this loop.
  if (existing.status !== "draft" && existing.status !== "rejected" && existing.status !== "pending_review") {
    throw new Error(`Cannot publish a product with status "${existing.status}"`);
  }
  if (existing.images.length === 0) {
    throw new Error("Add at least one product photo before publishing.");
  }

  const { data, error } = await supabase
    .from("gear_products")
    .update({ status: "live", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  await refreshCache(productId);
  const { data: variantRows } = await supabase.from("gear_product_variants").select("mrp, selling_price, stock_qty").eq("product_id", productId);
  return mapGearProduct(data as DbRow, (variantRows ?? []) as DbRow[]);
}

export async function setProductPaused(sellerId: string, productId: string, paused: boolean): Promise<GearProduct> {
  const supabase = getAdminClient();
  const existing = await getProductForSeller(sellerId, productId);
  if (!existing) throw new Error("Product not found for this seller");
  if (paused && existing.status !== "live") throw new Error("Only a live product can be paused");
  if (!paused && existing.status !== "paused") throw new Error("Only a paused product can be resumed");

  const { error } = await supabase
    .from("gear_products")
    .update({ status: paused ? "paused" : "live", updated_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("seller_id", sellerId);

  if (error) throw error;
  await refreshCache(productId);
  const updated = await getProductForSeller(sellerId, productId);
  if (!updated) throw new Error("Product updated but could not be reloaded");
  return updated;
}

export async function deleteDraftProduct(sellerId: string, productId: string): Promise<void> {
  const supabase = getAdminClient();
  const existing = await getProductForSeller(sellerId, productId);
  if (!existing) throw new Error("Product not found for this seller");
  if (existing.status !== "draft") throw new Error("Only a draft product can be deleted -- pause a live product instead");

  const { error } = await supabase.from("gear_products").delete().eq("id", productId).eq("seller_id", sellerId);
  if (error) throw error;
}

// --- Variants (size/color, each with its own absolute mrp/selling price) ---

export type SellerProductVariantInput = {
  size?: string;
  color?: string;
  mrp?: number;
  sellingPrice?: number;
  stockQty?: number;
  skuSuffix?: string;
  images?: string[];
};

function mapProductVariant(row: DbRow) {
  return {
    id: str(row, "id"),
    productId: str(row, "product_id"),
    size: optionalStr(row, "size"),
    color: optionalStr(row, "color"),
    mrp: num(row, "mrp"),
    sellingPrice: num(row, "selling_price"),
    stockQty: num(row, "stock_qty"),
    skuSuffix: optionalStr(row, "sku_suffix"),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
  };
}

// Variant photos are optional (0 images falls back to the product's own
// gallery -- see GearProductDetail), but if any are set there must be
// exactly 2, and they must be different photos.
function validateVariantImages(images: string[] | undefined) {
  if (images === undefined) return;
  if (images.length === 0) return;
  if (images.length !== 2) throw new Error("Add exactly 2 photos for this variant, or none at all.");
  if (images[0] === images[1]) throw new Error("Upload two different photos for this variant.");
}

export async function getVariantsForProduct(sellerId: string, productId: string) {
  const owned = await getProductForSeller(sellerId, productId);
  if (!owned) throw new Error("Product not found for this seller");

  const supabase = getAdminClient();
  const { data, error } = await supabase.from("gear_product_variants").select("*").eq("product_id", productId).order("size", { ascending: true });
  if (error) throw error;
  return (data as DbRow[]).map(mapProductVariant);
}

export async function createProductVariant(sellerId: string, productId: string, input: SellerProductVariantInput) {
  const owned = await getProductForSeller(sellerId, productId);
  if (!owned) throw new Error("Product not found for this seller");
  if (input.mrp === undefined || input.sellingPrice === undefined) throw new Error("MRP and selling price are required for a variant.");
  validateVariantImages(input.images);

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_product_variants")
    .insert({
      product_id: productId,
      size: input.size || null,
      color: input.color || null,
      mrp: input.mrp,
      selling_price: input.sellingPrice,
      stock_qty: input.stockQty ?? 0,
      sku_suffix: input.skuSuffix || null,
      images: input.images ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;
  await refreshCache(productId);
  return mapProductVariant(data as DbRow);
}

export async function updateProductVariant(sellerId: string, variantId: string, input: SellerProductVariantInput) {
  const supabase = getAdminClient();
  const { data: variantRow, error: variantError } = await supabase.from("gear_product_variants").select("product_id").eq("id", variantId).maybeSingle();
  if (variantError) throw variantError;
  if (!variantRow) throw new Error("Variant not found");

  const productId = str(variantRow as DbRow, "product_id");
  const owned = await getProductForSeller(sellerId, productId);
  if (!owned) throw new Error("Variant does not belong to this seller");

  validateVariantImages(input.images);

  const patch: DbRow = {};
  if (input.size !== undefined) patch.size = input.size || null;
  if (input.color !== undefined) patch.color = input.color || null;
  if (input.mrp !== undefined) patch.mrp = input.mrp;
  if (input.sellingPrice !== undefined) patch.selling_price = input.sellingPrice;
  if (input.stockQty !== undefined) patch.stock_qty = input.stockQty;
  if (input.skuSuffix !== undefined) patch.sku_suffix = input.skuSuffix || null;
  if (input.images !== undefined) patch.images = input.images;

  const { data, error } = await supabase.from("gear_product_variants").update(patch).eq("id", variantId).select("*").single();
  if (error) throw error;
  await refreshCache(productId);
  return mapProductVariant(data as DbRow);
}

export async function deleteProductVariant(sellerId: string, variantId: string): Promise<void> {
  const supabase = getAdminClient();
  const { data: variantRow, error: variantError } = await supabase.from("gear_product_variants").select("product_id").eq("id", variantId).maybeSingle();
  if (variantError) throw variantError;
  if (!variantRow) throw new Error("Variant not found");

  const productId = str(variantRow as DbRow, "product_id");
  const owned = await getProductForSeller(sellerId, productId);
  if (!owned) throw new Error("Variant does not belong to this seller");

  const { count } = await supabase.from("gear_product_variants").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if ((count ?? 0) <= 1) throw new Error("A product must have at least one variant -- add a replacement before deleting the last one.");

  const { error } = await supabase.from("gear_product_variants").delete().eq("id", variantId);
  if (error) throw error;
  await refreshCache(productId);
}
