import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { GEAR_PRICE_BUCKETS } from "@/lib/utils/gear-price-buckets";
import type { GearCollectionProductCard } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// --- Vehicle types: rarely changes, long TTL ---

export const getPublicVehicleTypes = unstable_cache(
  async () => {
    const supabase = getClient();
    const { data, error } = await supabase.from("vehicle_types").select("*").order("name", { ascending: true });
    if (error || !data) return [];
    return (data as DbRow[]).map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug) }));
  },
  ["gear-vehicle-types"],
  { revalidate: 3600 },
);

// --- Category tree, optionally filtered by vehicle type slug ---

export const getPublicGearCategories = unstable_cache(
  async (vehicleTypeSlug?: string) => {
    const supabase = getClient();
    let vehicleTypeId: string | null = null;

    if (vehicleTypeSlug) {
      const { data: vt } = await supabase.from("vehicle_types").select("id").eq("slug", vehicleTypeSlug).maybeSingle();
      vehicleTypeId = vt ? String((vt as DbRow).id) : null;
      if (!vehicleTypeId) return [];
    }

    const { data, error } = await supabase
      .from("gear_categories")
      .select("*")
      .eq("is_active", true)
      .order("level", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error || !data) return [];

    const rows = (data as DbRow[]).map((row) => ({
      id: String(row.id),
      parentId: typeof row.parent_id === "string" ? row.parent_id : undefined,
      name: String(row.name),
      slug: String(row.slug),
      level: Number(row.level),
      applicableVehicleTypes: Array.isArray(row.applicable_vehicle_types) ? (row.applicable_vehicle_types as string[]) : [],
      sortOrder: Number(row.sort_order ?? 0),
      imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
    }));

    if (!vehicleTypeId) return rows;
    return rows.filter((r) => r.applicableVehicleTypes.length === 0 || r.applicableVehicleTypes.includes(vehicleTypeId!));
  },
  ["gear-categories"],
  { revalidate: 3600 },
);

// --- PLP: filtered, cursor-paginated read against gear_catalog_index. Never a
// live join -- every filter here targets a column that already lives flat on
// the cache table. ---

export type GearPlpFilters = {
  q?: string; // free-text search over title (to_tsvector-GIN-indexed on gear_catalog_index)
  vehicleType?: string; // slug
  category?: string; // slug (L1 or L2)
  modelId?: string;
  brandId?: string; // vehicle brand compatibility (compatible_brand_ids)
  brandName?: string; // single-select legacy form, e.g. "shop by brand" links
  brandNames?: string[]; // multi-select sidebar checkboxes -- OR'd together
  segment?: string;
  usage?: string;
  priceMin?: number;
  priceMax?: number;
  priceBuckets?: number[]; // indices into GEAR_PRICE_BUCKETS, OR'd together
  sort?: "popularity" | "price_asc" | "price_desc";
  cursor?: string; // last row's updated_at from the previous page
  limit?: number;
};

// Resolves a category slug to the (column, value) pair to filter gear_catalog_index
// on, since the cache table stores category names flat rather than an id/slug FK.
async function resolveCategoryFilterColumn(
  supabase: ReturnType<typeof getClient>,
  categorySlug: string,
): Promise<{ column: "category_l1" | "category_l2"; value: string } | null> {
  const { data: category } = await supabase.from("gear_categories").select("name, level").eq("slug", categorySlug).maybeSingle();
  if (!category) return null;
  const column = Number((category as DbRow).level) === 2 ? "category_l2" : "category_l1";
  return { column, value: String((category as DbRow).name) };
}

// A "global" compatibility product has empty compatible_*_ids arrays (there's
// nothing specific to list), so a plain .contains() filter would wrongly
// exclude it. Every compatibility-axis filter (vehicle type / model / brand /
// segment -- NOT category or usage, which are independent axes) must also
// admit rows flagged is_universal.
function orCompatibilityFilter(column: string, value: string) {
  return `${column}.cs.{${value}},is_universal.eq.true`;
}

// Filtering the PLP by a specific model must also surface products tagged at
// a broader compatibility level (vehicle_type/segment/brand) that logically
// cover that model -- mirrors computeTopProductsForModel's resolution, just
// applied to gear_catalog_index's flat compatible_*_ids columns instead of
// the raw gear_product_compatibility rows.
async function resolveModelContext(supabase: ReturnType<typeof getClient>, modelId: string) {
  const { data: modelRow } = await supabase
    .from("vehicle_models")
    .select("id, brand_id, body_type, vehicle_categories(vehicle_type_id)")
    .eq("id", modelId)
    .maybeSingle();
  if (!modelRow) return null;

  const model = modelRow as DbRow;
  const category = model.vehicle_categories as DbRow | null;
  return {
    vehicleTypeId: category ? (category.vehicle_type_id as string | null) : null,
    brandId: model.brand_id ? String(model.brand_id) : null,
    segment: model.body_type ? String(model.body_type) : null,
  };
}

function modelCompatibilityFilter(
  modelId: string,
  context: { vehicleTypeId: string | null; brandId: string | null; segment: string | null } | null,
) {
  const clauses = [`compatible_model_ids.cs.{${modelId}}`, "is_universal.eq.true"];
  if (context?.vehicleTypeId) clauses.push(`compatible_vehicle_type_ids.cs.{${context.vehicleTypeId}}`);
  if (context?.brandId) clauses.push(`compatible_brand_ids.cs.{${context.brandId}}`);
  if (context?.segment) clauses.push(`compatible_segments.cs.{${context.segment}}`);
  return clauses.join(",");
}

export async function getGearProductsPLP(filters: GearPlpFilters) {
  const supabase = getClient();
  const limit = Math.min(filters.limit ?? 24, 50);

  let query = supabase.from("gear_catalog_index").select("*").eq("status", "live");

  if (filters.q && filters.q.trim()) query = query.textSearch("title", filters.q.trim(), { type: "websearch" });
  if (filters.vehicleType) {
    const { data: vt } = await supabase.from("vehicle_types").select("id").eq("slug", filters.vehicleType).maybeSingle();
    if (!vt) return { products: [], nextCursor: null };
    query = query.or(orCompatibilityFilter("compatible_vehicle_type_ids", String((vt as DbRow).id)));
  }
  if (filters.category) {
    const categoryFilter = await resolveCategoryFilterColumn(supabase, filters.category);
    if (categoryFilter) query = query.eq(categoryFilter.column, categoryFilter.value);
  }
  if (filters.modelId) {
    const context = await resolveModelContext(supabase, filters.modelId);
    query = query.or(modelCompatibilityFilter(filters.modelId, context));
  }
  if (filters.brandId) query = query.or(orCompatibilityFilter("compatible_brand_ids", filters.brandId));
  if (filters.brandNames?.length) query = query.in("brand_name", filters.brandNames);
  else if (filters.brandName) query = query.eq("brand_name", filters.brandName);
  if (filters.segment) query = query.or(orCompatibilityFilter("compatible_segments", filters.segment));
  if (filters.usage) query = query.contains("usage_tags", [filters.usage]);
  if (filters.priceMin !== undefined) query = query.gte("price", filters.priceMin);
  if (filters.priceMax !== undefined) query = query.lte("price", filters.priceMax);
  if (filters.priceBuckets?.length) {
    const orParts = filters.priceBuckets
      .map((i) => GEAR_PRICE_BUCKETS[i])
      .filter((b): b is (typeof GEAR_PRICE_BUCKETS)[number] => Boolean(b))
      .map((b) => (b.max !== undefined ? `and(price.gte.${b.min},price.lte.${b.max})` : `price.gte.${b.min}`));
    if (orParts.length) query = query.or(orParts.join(","));
  }
  if (filters.cursor) query = query.lt("updated_at", filters.cursor);

  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("updated_at", { ascending: false });

  const { data, error } = await query.limit(limit);
  if (error || !data) return { products: [], nextCursor: null };

  const rows = data as DbRow[];
  const nextCursor = rows.length === limit ? String(rows[rows.length - 1].updated_at) : null;

  return {
    products: rows.map((row) => ({
      productId: String(row.product_id),
      title: String(row.title),
      slug: String(row.slug),
      categoryL1: String(row.category_l1 ?? ""),
      categoryL2: String(row.category_l2 ?? ""),
      brandName: row.brand_name ? String(row.brand_name) : undefined,
      sellerName: row.seller_name ? String(row.seller_name) : undefined,
      price: Number(row.price),
      mrp: Number(row.mrp),
      startingFrom: Boolean(row.starting_from),
      variantCount: Number(row.variant_count ?? 1),
      ratingAvg: Number(row.rating_avg ?? 0),
      thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
    })),
    nextCursor,
  };
}

// --- Filter facets: a live aggregate query over gear_catalog_index. Cheap
// because it's flat + GIN-indexed already -- no separate cache table needed
// for v1 (per the architecture plan; add one later only if this shows up in
// slow-query logs). ---

// Per-option result counts for the filter sidebar (the "(42)" next to each
// category/price/brand option that every serious marketplace shows, so a
// buyer can tell an option is worth clicking before they click it). Two
// separate scoped queries, not one, because each facet's count must ignore
// its *own* axis or picking one brand would make every other brand look
// like it has zero results:
//   - category counts ignore category/brand/price (so every category link
//     always shows what the *current search* would yield in it)
//   - brand + price-bucket counts ignore brand/price respectively, but DO
//     respect the active category (a refinement within it), matching how
//     most faceted search UIs behave. Brand selection intentionally does
//     not further narrow price-bucket counts (and vice versa) -- true
//     cross-narrowing would need one query per facet; deferred until the
//     catalog is large enough for the gap to matter.
export async function getGearFilterFacets(filters: Pick<GearPlpFilters, "vehicleType" | "category" | "q">) {
  const supabase = getClient();

  let categoryScope = supabase.from("gear_catalog_index").select("category_l1, category_l2").eq("status", "live");
  let refinementScope = supabase
    .from("gear_catalog_index")
    .select("brand_name, price, usage_tags, compatible_segments")
    .eq("status", "live");

  if (filters.vehicleType) {
    const { data: vt } = await supabase.from("vehicle_types").select("id").eq("slug", filters.vehicleType).maybeSingle();
    if (vt) {
      const clause = orCompatibilityFilter("compatible_vehicle_type_ids", String((vt as DbRow).id));
      categoryScope = categoryScope.or(clause);
      refinementScope = refinementScope.or(clause);
    }
  }
  if (filters.q && filters.q.trim()) {
    categoryScope = categoryScope.textSearch("title", filters.q.trim(), { type: "websearch" });
    refinementScope = refinementScope.textSearch("title", filters.q.trim(), { type: "websearch" });
  }
  if (filters.category) {
    const categoryFilter = await resolveCategoryFilterColumn(supabase, filters.category);
    if (categoryFilter) refinementScope = refinementScope.eq(categoryFilter.column, categoryFilter.value);
  }

  const [{ data: categoryRows, error: categoryError }, { data: refinementRows, error: refinementError }] = await Promise.all([
    categoryScope.limit(2000),
    refinementScope.limit(2000),
  ]);

  const categoryCounts: Record<string, number> = {};
  for (const row of (categoryRows ?? []) as DbRow[]) {
    if (row.category_l1) categoryCounts[String(row.category_l1)] = (categoryCounts[String(row.category_l1)] ?? 0) + 1;
    if (row.category_l2) categoryCounts[String(row.category_l2)] = (categoryCounts[String(row.category_l2)] ?? 0) + 1;
  }
  if (categoryError) console.error("getGearFilterFacets: category count query failed", categoryError);

  if (refinementError || !refinementRows) {
    return {
      brands: [],
      brandCounts: {} as Record<string, number>,
      priceBucketCounts: GEAR_PRICE_BUCKETS.map(() => 0),
      categoryCounts,
      priceMin: 0,
      priceMax: 0,
      usageTags: [],
      segments: [],
    };
  }

  const rows = refinementRows as DbRow[];
  const brandCounts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.brand_name) continue;
    const name = String(row.brand_name);
    brandCounts[name] = (brandCounts[name] ?? 0) + 1;
  }
  const brands = Object.keys(brandCounts).sort();

  const priceBucketCounts = GEAR_PRICE_BUCKETS.map(
    (bucket) =>
      rows.filter((r) => {
        const price = Number(r.price);
        if (Number.isNaN(price)) return false;
        return price >= bucket.min && (bucket.max === undefined || price <= bucket.max);
      }).length,
  );

  const usageTags = Array.from(new Set(rows.flatMap((r) => (Array.isArray(r.usage_tags) ? (r.usage_tags as string[]) : [])))).sort();
  const segments = Array.from(new Set(rows.flatMap((r) => (Array.isArray(r.compatible_segments) ? (r.compatible_segments as string[]) : [])))).sort();
  const prices = rows.map((r) => Number(r.price)).filter((p) => !Number.isNaN(p));

  return {
    brands,
    brandCounts,
    priceBucketCounts,
    categoryCounts,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    usageTags,
    segments,
  };
}

// --- PDP: single row + variants join, cheap PK/slug lookup (never through the
// catalog index -- that's for listing/filtering, not the full product detail). ---

export type GearFitmentLabel = { text: string; universal?: boolean };

// Resolves compatibility rows to buyer-facing labels ("KTM Duke 390", "All
// Royal Enfield models", "Universal fit") -- separate from gear_catalog_index's
// compatible_*_ids (those are for filtering, flat id arrays; this is for
// display, so it needs actual names, which means a handful of small joins).
// PDP traffic is far lower than PLP/browse traffic, so this stays a live
// lookup rather than needing its own cache table.
async function getFitmentLabels(supabase: ReturnType<typeof getClient>, productId: string): Promise<GearFitmentLabel[]> {
  const { data: rows } = await supabase.from("gear_product_compatibility").select("*").eq("product_id", productId);
  const compatRows = (rows ?? []) as DbRow[];
  if (compatRows.length === 0) return [];

  const vehicleTypeIds = new Set<string>();
  const brandIds = new Set<string>();
  const modelIds = new Set<string>();
  const variantIds = new Set<string>();
  for (const row of compatRows) {
    if (row.vehicle_type_id) vehicleTypeIds.add(String(row.vehicle_type_id));
    if (row.vehicle_brand_id) brandIds.add(String(row.vehicle_brand_id));
    if (row.vehicle_model_id) modelIds.add(String(row.vehicle_model_id));
    if (row.vehicle_variant_id) variantIds.add(String(row.vehicle_variant_id));
  }

  const [vehicleTypesRes, brandsRes, modelsRes, variantsRes] = await Promise.all([
    vehicleTypeIds.size ? supabase.from("vehicle_types").select("id, name").in("id", Array.from(vehicleTypeIds)) : Promise.resolve({ data: [] }),
    brandIds.size ? supabase.from("brands").select("id, name").in("id", Array.from(brandIds)) : Promise.resolve({ data: [] }),
    modelIds.size ? supabase.from("vehicle_models").select("id, name").in("id", Array.from(modelIds)) : Promise.resolve({ data: [] }),
    variantIds.size ? supabase.from("vehicle_variants").select("id, name").in("id", Array.from(variantIds)) : Promise.resolve({ data: [] }),
  ]);
  const vehicleTypeName = new Map(((vehicleTypesRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)]));
  const brandName = new Map(((brandsRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)]));
  const modelName = new Map(((modelsRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)]));
  const variantName = new Map(((variantsRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)]));

  return compatRows.map((row): GearFitmentLabel => {
    switch (row.compatibility_type) {
      case "global":
        return { text: "Universal fit", universal: true };
      case "vehicle_type":
        return { text: `All ${vehicleTypeName.get(String(row.vehicle_type_id)) ?? "vehicles"}` };
      case "segment":
        return { text: `${vehicleTypeName.get(String(row.vehicle_type_id)) ?? "Vehicles"} — ${row.segment}` };
      case "brand":
        return { text: `All ${brandName.get(String(row.vehicle_brand_id)) ?? "brand"} models` };
      case "model":
        return { text: String(modelName.get(String(row.vehicle_model_id)) ?? "a model") };
      case "variant":
        return { text: `${modelName.get(String(row.vehicle_model_id)) ?? "Model"} ${variantName.get(String(row.vehicle_variant_id)) ?? ""}`.trim() };
      default:
        return { text: String(row.compatibility_type) };
    }
  });
}

export async function getGearProductBySlug(slug: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select("*, sellers(id, business_name), gear_brands(name), gear_categories(name, slug, parent_id), gear_product_variants(*)")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as DbRow;
  const seller = row.sellers as DbRow | null;
  const brand = row.gear_brands as DbRow | null;
  const category = row.gear_categories as DbRow | null;
  const variants = Array.isArray(row.gear_product_variants) ? (row.gear_product_variants as DbRow[]) : [];

  let parentCategory: { name: string; slug: string } | undefined;
  if (category?.parent_id) {
    const { data: parent } = await supabase.from("gear_categories").select("name, slug").eq("id", category.parent_id).maybeSingle();
    if (parent) parentCategory = { name: String((parent as DbRow).name), slug: String((parent as DbRow).slug) };
  }

  const fitment = await getFitmentLabels(supabase, String(row.id));

  return {
    id: String(row.id),
    sellerId: seller ? String(seller.id) : undefined,
    title: String(row.title),
    slug: String(row.slug),
    description: typeof row.description === "string" ? row.description : undefined,
    gstRate: Number(row.gst_rate),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    usageTags: Array.isArray(row.usage_tags) ? (row.usage_tags as string[]) : [],
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    sellerName: seller ? String(seller.business_name) : undefined,
    brandName: brand ? String(brand.name) : undefined,
    categoryName: category ? String(category.name) : undefined,
    categorySlug: category ? String(category.slug) : undefined,
    parentCategory,
    fitment,
    // Every product has >= 1 variant; price/MRP/stock live there exclusively
    // -- no product-level price/stock to return here anymore.
    variants: variants.map((v) => ({
      id: String(v.id),
      size: typeof v.size === "string" ? v.size : undefined,
      color: typeof v.color === "string" ? v.color : undefined,
      mrp: Number(v.mrp),
      sellingPrice: Number(v.selling_price),
      stockQty: Number(v.stock_qty ?? 0),
      images: Array.isArray(v.images) ? (v.images as string[]) : [],
    })),
  };
}

// --- Delivery estimate on the PDP itself, before add-to-cart. Pincode-only
// (no state), unlike checkout's full checkServiceability -- good enough for a
// quick estimate; the authoritative check still happens at checkout. ---

export async function getPublicDeliveryEstimate(sellerId: string, pincode: string) {
  const supabase = getClient();
  const { data } = await supabase.from("seller_shipping_settings").select("*").eq("seller_id", sellerId).maybeSingle();

  if (!data) return { deliverable: true, fee: 0, estimatedDays: 5, codAvailable: false };

  const settings = data as DbRow;
  const shipsPanIndia = Boolean(settings.ships_pan_india ?? true);
  const excludedPincodes = Array.isArray(settings.excluded_pincodes) ? (settings.excluded_pincodes as string[]) : [];
  if (!shipsPanIndia && excludedPincodes.includes(pincode)) {
    return { deliverable: false, fee: 0, estimatedDays: 0, codAvailable: false };
  }
  if (excludedPincodes.includes(pincode)) {
    return { deliverable: false, fee: 0, estimatedDays: 0, codAvailable: false };
  }

  const feeType = String(settings.fee_type ?? "flat");
  const flatFee = Number(settings.flat_fee ?? 0);
  return {
    deliverable: true,
    fee: feeType === "free" ? 0 : flatFee,
    estimatedDays: Number(settings.standard_delivery_days ?? 5),
    codAvailable: Boolean(settings.cod_available ?? false),
  };
}

// --- Recommended Gear widget: single PK lookup, zero joins ---

export async function getRecommendedGearForModel(modelId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from("gear_model_cache").select("top_products").eq("vehicle_model_id", modelId).maybeSingle();
  if (error || !data) return [];
  return (Array.isArray((data as DbRow).top_products) ? (data as DbRow).top_products : []) as Array<{
    productId: string;
    title: string;
    price: number;
    mrp: number;
    variantCount: number;
    thumbnailUrl: string | null;
    slug: string;
  }>;
}

// --- Seller storefront: low-traffic page, direct query against gear_products
// (not the catalog index) is fine here, same reasoning as the PDP. ---

export async function getPublicSellerProfile(sellerId: string) {
  const supabase = getClient();
  const { data } = await supabase
    .from("sellers")
    .select("id, business_name, brand_name, logo_url, banner_url, about, contact_email, contact_phone, status")
    .eq("id", sellerId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const row = data as DbRow;
  return {
    id: String(row.id),
    businessName: String(row.business_name),
    brandName: typeof row.brand_name === "string" ? row.brand_name : undefined,
    logoUrl: typeof row.logo_url === "string" ? row.logo_url : undefined,
    bannerUrl: typeof row.banner_url === "string" ? row.banner_url : undefined,
    about: typeof row.about === "string" ? row.about : undefined,
    contactEmail: typeof row.contact_email === "string" ? row.contact_email : undefined,
    contactPhone: typeof row.contact_phone === "string" ? row.contact_phone : undefined,
  };
}

export async function getGearProductsBySeller(sellerId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select("id, title, slug, images, rating_avg")
    .eq("seller_id", sellerId)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const rows = data as DbRow[];
  const productIds = rows.map((r) => String(r.id));
  const { data: variantRows } = productIds.length
    ? await supabase.from("gear_product_variants").select("product_id, mrp, selling_price").in("product_id", productIds)
    : { data: [] as DbRow[] };

  const cheapestByProduct = new Map<string, DbRow>();
  for (const v of (variantRows ?? []) as DbRow[]) {
    const pid = String(v.product_id);
    const current = cheapestByProduct.get(pid);
    if (!current || Number(v.selling_price) < Number(current.selling_price)) cheapestByProduct.set(pid, v);
  }

  return rows.map((row) => {
    const cheapest = cheapestByProduct.get(String(row.id));
    return {
      productId: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      price: cheapest ? Number(cheapest.selling_price) : 0,
      mrp: cheapest ? Number(cheapest.mrp) : 0,
      ratingAvg: Number(row.rating_avg ?? 0),
      thumbnailUrl: Array.isArray(row.images) && row.images[0] ? String(row.images[0]) : undefined,
    };
  });
}

// --- Search: to_tsvector on gear_catalog_index.title, never on the live table ---

export async function searchGearCatalog(searchQuery: string, vehicleTypeSlug?: string) {
  const supabase = getClient();
  let query = supabase.from("gear_catalog_index").select("*").eq("status", "live").textSearch("title", searchQuery, { type: "websearch" });

  if (vehicleTypeSlug) {
    const { data: vt } = await supabase.from("vehicle_types").select("id").eq("slug", vehicleTypeSlug).maybeSingle();
    if (vt) query = query.contains("compatible_vehicle_type_ids", [(vt as DbRow).id]);
  }

  const { data, error } = await query.limit(24);
  if (error || !data) return [];

  return (data as DbRow[]).map((row) => ({
    productId: String(row.product_id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price),
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
  }));
}

// --- Collections & homepage merchandising (GAADIGEAR_SPEC.md §12). Both
// reads never evaluate a collection's conditions live -- they only ever read
// gear_collection_products_cache, which lib/services/gear-collections-cache
// maintains via an admin-triggered rebuild (no pg_cron in this codebase). ---

export type GearHomepageSectionView = {
  id: string;
  title: string;
  subtitle?: string;
  displayStyle: string;
  collectionSlug: string;
  collectionName: string;
  description?: string;
  bannerImage?: string;
  icon?: string;
  products: GearCollectionProductCard[];
};

export const getPublicHomepageSections = unstable_cache(
  async (): Promise<GearHomepageSectionView[]> => {
    const supabase = getClient();
    const { data: sectionRows, error } = await supabase
      .from("gear_homepage_sections")
      .select("*, gear_collections(id, slug, name, description, banner_image, icon, is_active, start_at, end_at)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !sectionRows) return [];

    const now = new Date();
    const rows = (sectionRows as DbRow[]).filter((row) => {
      const collection = row.gear_collections as DbRow | null;
      if (!collection || !collection.is_active) return false;
      const startAt = collection.start_at ? new Date(String(collection.start_at)) : null;
      const endAt = collection.end_at ? new Date(String(collection.end_at)) : null;
      if (startAt && now < startAt) return false;
      if (endAt && now > endAt) return false;
      return true;
    });
    if (rows.length === 0) return [];

    const collectionIds = rows.map((row) => String((row.gear_collections as DbRow).id));
    const { data: cacheRows } = await supabase
      .from("gear_collection_products_cache")
      .select("collection_id, product_cards")
      .in("collection_id", collectionIds);
    const cardsByCollection = new Map(
      ((cacheRows ?? []) as DbRow[]).map((r) => [String(r.collection_id), (r.product_cards ?? []) as unknown as GearCollectionProductCard[]]),
    );

    return rows.map((row) => {
      const collection = row.gear_collections as DbRow;
      return {
        id: String(row.id),
        title: String(row.title),
        subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
        displayStyle: String(row.display_style ?? "carousel"),
        collectionSlug: String(collection.slug),
        collectionName: String(collection.name),
        description: typeof collection.description === "string" ? collection.description : undefined,
        bannerImage: typeof collection.banner_image === "string" ? collection.banner_image : undefined,
        icon: typeof collection.icon === "string" ? collection.icon : undefined,
        products: cardsByCollection.get(String(collection.id)) ?? [],
      };
    });
  },
  ["gear-homepage-sections"],
  { revalidate: 600 },
);

export async function getPublicCollectionBySlug(slug: string) {
  const supabase = getClient();
  const { data, error } = await supabase.from("gear_collections").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error || !data) return null;

  const row = data as DbRow;
  const now = new Date();
  const startAt = row.start_at ? new Date(String(row.start_at)) : null;
  const endAt = row.end_at ? new Date(String(row.end_at)) : null;
  if ((startAt && now < startAt) || (endAt && now > endAt)) return null;

  const { data: cache } = await supabase
    .from("gear_collection_products_cache")
    .select("product_cards")
    .eq("collection_id", row.id)
    .maybeSingle();

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : undefined,
    bannerImage: typeof row.banner_image === "string" ? row.banner_image : undefined,
    products: ((cache as DbRow | null)?.product_cards ?? []) as unknown as GearCollectionProductCard[],
  };
}

// --- Featured brands (Shop by Top Brands strip). gear_brands already carries
// logo_url; only brands with at least one live product are shown, resolved
// via gear_products (gear_catalog_index has brand_name text, not brand_id,
// so it can't answer "which brands" -- this stays a light direct query). ---

export const getPublicFeaturedBrands = unstable_cache(
  async () => {
    const supabase = getClient();
    const [{ data: brands }, { data: liveProducts }] = await Promise.all([
      supabase.from("gear_brands").select("id, name, logo_url").eq("active", true),
      supabase.from("gear_products").select("brand_id").eq("status", "live").not("brand_id", "is", null),
    ]);

    const liveBrandIds = new Set(((liveProducts ?? []) as DbRow[]).map((r) => String(r.brand_id)));
    return ((brands ?? []) as DbRow[])
      .filter((b) => liveBrandIds.has(String(b.id)))
      .map((b) => ({ id: String(b.id), name: String(b.name), logoUrl: b.logo_url ? String(b.logo_url) : undefined }));
  },
  ["gear-featured-brands"],
  { revalidate: 900 },
);

// --- Homepage hero banner: admin-editable, falls back to null (the homepage
// renders its own default text-only hero) when nothing's configured yet. ---

export const getPublicHeroBanner = unstable_cache(
  async () => {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("gear_hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;

    const row = data as DbRow;
    return {
      title: String(row.title),
      subtitle: typeof row.subtitle === "string" ? row.subtitle : undefined,
      imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
      ctaLabel: String(row.cta_label ?? "Shop now"),
      ctaHref: String(row.cta_href ?? "/gaadigear/products"),
    };
  },
  ["gear-hero-banner"],
  { revalidate: 300 },
);
