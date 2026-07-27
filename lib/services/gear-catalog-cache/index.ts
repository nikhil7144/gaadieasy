import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DbRow = Record<string, unknown>;

const MAX_TOP_PRODUCTS = 12;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// --- gear_catalog_index: one flat row per product, rebuilt whenever the product
// or its compatibility rows change. This is what every buyer-facing PLP/search/
// filter query reads -- never a live join. ---

export async function upsertCatalogIndexRow(productId: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: productRow, error: productError } = await supabase
    .from("gear_products")
    .select("*, sellers(business_name), gear_brands(name), gear_categories(id, name, level, parent_id)")
    .eq("id", productId)
    .maybeSingle();

  if (productError) throw productError;
  if (!productRow) return; // product was deleted between trigger and run -- nothing to index

  const product = productRow as DbRow;
  const category = product.gear_categories as DbRow | null;
  const seller = product.sellers as DbRow | null;
  const brand = product.gear_brands as DbRow | null;

  let categoryL1 = "";
  let categoryL2 = "";
  if (category) {
    if (Number(category.level) === 2) {
      categoryL2 = String(category.name);
      const { data: parent } = await supabase.from("gear_categories").select("name").eq("id", category.parent_id).maybeSingle();
      categoryL1 = parent ? String((parent as DbRow).name) : "";
    } else {
      categoryL1 = String(category.name);
    }
  }

  const { data: compatRows, error: compatError } = await supabase
    .from("gear_product_compatibility")
    .select("*")
    .eq("product_id", productId);

  if (compatError) throw compatError;
  const compat = (compatRows ?? []) as DbRow[];

  // price/mrp represent the cheapest variant (a product can have several at
  // different prices) -- every product has >= 1 variant, price lives there
  // exclusively, there is no product-level price to fall back to.
  const { data: variantRows, error: variantsError } = await supabase
    .from("gear_product_variants")
    .select("mrp, selling_price")
    .eq("product_id", productId);
  if (variantsError) throw variantsError;
  const variants = (variantRows ?? []) as DbRow[];
  const cheapest = variants.reduce<DbRow | null>(
    (min, v) => (min === null || Number(v.selling_price) < Number(min.selling_price) ? v : min),
    null,
  );

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];

  const { error: upsertError } = await supabase.from("gear_catalog_index").upsert(
    {
      product_id: productId,
      title: String(product.title),
      slug: String(product.slug),
      category_l1: categoryL1,
      category_l2: categoryL2,
      brand_name: brand ? String(brand.name) : null,
      seller_name: seller ? String(seller.business_name) : null,
      price: cheapest ? Number(cheapest.selling_price) : 0,
      mrp: cheapest ? Number(cheapest.mrp) : 0,
      starting_from: variants.length > 1,
      variant_count: variants.length,
      rating_avg: Number(product.rating_avg ?? 0),
      thumbnail_url: images[0] ?? null,
      usage_tags: Array.isArray(product.usage_tags) ? product.usage_tags : [],
      compatible_vehicle_type_ids: dedupe(compat.map((c) => c.vehicle_type_id).filter(Boolean)),
      compatible_segments: dedupe(compat.map((c) => c.segment).filter(Boolean)),
      compatible_brand_ids: dedupe(compat.map((c) => c.vehicle_brand_id).filter(Boolean)),
      compatible_model_ids: dedupe(compat.map((c) => c.vehicle_model_id).filter(Boolean)),
      compatible_variant_ids: dedupe(compat.map((c) => c.vehicle_variant_id).filter(Boolean)),
      compatibility_max_specificity: compat.reduce((max, c) => Math.max(max, Number(c.specificity_level ?? 0)), 0),
      is_universal: compat.some((c) => c.compatibility_type === "global"),
      status: String(product.status),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" },
  );

  if (upsertError) throw upsertError;
}

function dedupe(values: unknown[]): string[] {
  return Array.from(new Set(values.map(String)));
}

// --- gear_model_cache: precomputed "Recommended Gear" widget, one row per
// vehicle_model, ready to render with zero joins at request time. ---

type TopProduct = {
  productId: string;
  title: string;
  price: number;
  mrp: number;
  variantCount: number;
  thumbnailUrl: string | null;
  slug: string;
};

async function computeTopProductsForModel(modelId: string): Promise<TopProduct[]> {
  const supabase = getAdminClient();

  const { data: modelRow, error: modelError } = await supabase
    .from("vehicle_models")
    .select("id, brand_id, category_id, body_type, vehicle_categories(vehicle_type_id)")
    .eq("id", modelId)
    .maybeSingle();

  if (modelError) throw modelError;
  if (!modelRow) return [];

  const model = modelRow as DbRow;
  const category = model.vehicle_categories as DbRow | null;
  const vehicleTypeId = category ? (category.vehicle_type_id as string | null) : null;
  const brandId = String(model.brand_id);
  const segment = model.body_type as string | null;

  const orFilters = [
    "compatibility_type.eq.global",
    vehicleTypeId ? `and(compatibility_type.eq.vehicle_type,vehicle_type_id.eq.${vehicleTypeId})` : null,
    vehicleTypeId && segment ? `and(compatibility_type.eq.segment,vehicle_type_id.eq.${vehicleTypeId},segment.eq.${segment})` : null,
    `and(compatibility_type.eq.brand,vehicle_brand_id.eq.${brandId})`,
    `and(compatibility_type.eq.model,vehicle_model_id.eq.${modelId})`,
    `and(compatibility_type.eq.variant,vehicle_model_id.eq.${modelId})`,
  ].filter((f): f is string => Boolean(f));

  const { data: compatRows, error: compatError } = await supabase
    .from("gear_product_compatibility")
    .select("product_id, specificity_level")
    .or(orFilters.join(","));

  if (compatError) throw compatError;

  const bestSpecificityByProduct = new Map<string, number>();
  for (const row of (compatRows ?? []) as DbRow[]) {
    const productId = String(row.product_id);
    const specificity = Number(row.specificity_level ?? 0);
    bestSpecificityByProduct.set(productId, Math.max(bestSpecificityByProduct.get(productId) ?? 0, specificity));
  }

  if (bestSpecificityByProduct.size === 0) return [];

  const { data: productRows, error: productsError } = await supabase
    .from("gear_products")
    .select("id, title, slug, images, rating_avg, status")
    .in("id", Array.from(bestSpecificityByProduct.keys()))
    .eq("status", "live");

  if (productsError) throw productsError;

  const productIds = ((productRows ?? []) as DbRow[]).map((p) => String(p.id));
  const { data: variantRows, error: variantsError } = productIds.length
    ? await supabase.from("gear_product_variants").select("product_id, mrp, selling_price").in("product_id", productIds)
    : { data: [] as DbRow[], error: null };
  if (variantsError) throw variantsError;

  const variantsByProduct = new Map<string, DbRow[]>();
  for (const v of (variantRows ?? []) as DbRow[]) {
    const pid = String(v.product_id);
    const list = variantsByProduct.get(pid) ?? [];
    list.push(v);
    variantsByProduct.set(pid, list);
  }
  const cheapestByProduct = new Map<string, DbRow>();
  for (const [pid, vs] of variantsByProduct) {
    const cheapest = vs.reduce((min, v) => (Number(v.selling_price) < Number(min.selling_price) ? v : min));
    cheapestByProduct.set(pid, cheapest);
  }

  return ((productRows ?? []) as DbRow[])
    .map((p) => {
      const id = String(p.id);
      const cheapest = cheapestByProduct.get(id);
      return {
        productId: id,
        title: String(p.title),
        price: cheapest ? Number(cheapest.selling_price) : 0,
        mrp: cheapest ? Number(cheapest.mrp) : 0,
        variantCount: variantsByProduct.get(id)?.length ?? 0,
        thumbnailUrl: Array.isArray(p.images) && p.images.length ? String(p.images[0]) : null,
        slug: String(p.slug),
        specificity: bestSpecificityByProduct.get(id) ?? 0,
        ratingAvg: Number(p.rating_avg ?? 0),
      };
    })
    .sort((a, b) => b.specificity - a.specificity || b.ratingAvg - a.ratingAvg)
    .slice(0, MAX_TOP_PRODUCTS)
    .map(({ productId, title, price, mrp, variantCount, thumbnailUrl, slug }) => ({ productId, title, price, mrp, variantCount, thumbnailUrl, slug }));
}

export async function upsertModelCacheRow(modelId: string): Promise<void> {
  const supabase = getAdminClient();
  const topProducts = await computeTopProductsForModel(modelId);

  const { error } = await supabase.from("gear_model_cache").upsert(
    { vehicle_model_id: modelId, top_products: topProducts, updated_at: new Date().toISOString() },
    { onConflict: "vehicle_model_id" },
  );

  if (error) throw error;
}

// --- Invalidation entry point, called (awaited) from product mutation
// functions. Narrow compatibility (model/variant/brand) is cheap and bounded,
// so it's recomputed synchronously here. Broad compatibility (vehicle_type/
// segment/global) can touch dozens of models at once -- per the architecture
// plan, that rare case is left for the manual admin rebuild rather than
// blocking the seller's/admin's request. ---

export type InvalidationResult = { modelsRefreshed: number; deferredBroadCompatibility: boolean };

export async function invalidateModelCacheForProduct(productId: string): Promise<InvalidationResult> {
  const supabase = getAdminClient();
  const { data: compatRows, error } = await supabase.from("gear_product_compatibility").select("*").eq("product_id", productId);
  if (error) throw error;

  const rows = (compatRows ?? []) as DbRow[];
  const narrowModelIds = new Set<string>();
  let deferredBroadCompatibility = false;

  for (const row of rows) {
    const type = String(row.compatibility_type);

    if (type === "model" || type === "variant") {
      if (row.vehicle_model_id) narrowModelIds.add(String(row.vehicle_model_id));
      continue;
    }

    if (type === "brand") {
      const { data: brandModels, error: brandError } = await supabase
        .from("vehicle_models")
        .select("id")
        .eq("brand_id", row.vehicle_brand_id)
        .eq("active", true);
      if (brandError) throw brandError;
      for (const m of (brandModels ?? []) as DbRow[]) narrowModelIds.add(String(m.id));
      continue;
    }

    // global, vehicle_type, segment -- broad fan-out, deferred to the manual rebuild
    deferredBroadCompatibility = true;
  }

  for (const modelId of narrowModelIds) {
    await upsertModelCacheRow(modelId);
  }

  return { modelsRefreshed: narrowModelIds.size, deferredBroadCompatibility };
}

// --- Manual full-catalog rebuild, mirroring PricingCacheBackfill -- an
// admin-triggered action, not a cron job. Used for initial population and to
// pick up the broad-compatibility cases invalidateModelCacheForProduct defers. ---

export async function rebuildFullCatalogCache(): Promise<{ products: number; models: number }> {
  const supabase = getAdminClient();

  const { data: productRows, error: productsError } = await supabase.from("gear_products").select("id");
  if (productsError) throw productsError;
  for (const row of (productRows ?? []) as DbRow[]) {
    await upsertCatalogIndexRow(String(row.id));
  }

  const { data: modelRows, error: modelsError } = await supabase.from("vehicle_models").select("id").eq("active", true);
  if (modelsError) throw modelsError;
  for (const row of (modelRows ?? []) as DbRow[]) {
    await upsertModelCacheRow(String(row.id));
  }

  return { products: (productRows ?? []).length, models: (modelRows ?? []).length };
}
