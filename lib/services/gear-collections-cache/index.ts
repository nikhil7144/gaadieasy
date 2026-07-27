import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GearCollectionProductCard } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// --- "Fits: X, Y, Z" / "Universal fit" line on a collection product card.
// Resolved from gear_catalog_index's flat compatible_*_ids arrays -- bounded
// to at most max_products (~12) rows per collection rebuild, so the extra
// name lookups here stay cheap even though this isn't itself cached. ---

type NameMaps = { models: Map<string, string>; brands: Map<string, string>; vehicleTypes: Map<string, string> };

async function buildFitsSummaryMaps(rows: DbRow[]): Promise<NameMaps> {
  const modelIds = new Set<string>();
  const brandIds = new Set<string>();
  const vehicleTypeIds = new Set<string>();
  for (const row of rows) {
    for (const id of (row.compatible_model_ids as string[] | null) ?? []) modelIds.add(id);
    for (const id of (row.compatible_brand_ids as string[] | null) ?? []) brandIds.add(id);
    for (const id of (row.compatible_vehicle_type_ids as string[] | null) ?? []) vehicleTypeIds.add(id);
  }

  const supabase = getAdminClient();
  const [modelsRes, brandsRes, vtRes] = await Promise.all([
    modelIds.size ? supabase.from("vehicle_models").select("id, name").in("id", Array.from(modelIds)) : Promise.resolve({ data: [] }),
    brandIds.size ? supabase.from("brands").select("id, name").in("id", Array.from(brandIds)) : Promise.resolve({ data: [] }),
    vehicleTypeIds.size
      ? supabase.from("vehicle_types").select("id, name").in("id", Array.from(vehicleTypeIds))
      : Promise.resolve({ data: [] }),
  ]);

  return {
    models: new Map(((modelsRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)])),
    brands: new Map(((brandsRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)])),
    vehicleTypes: new Map(((vtRes.data ?? []) as DbRow[]).map((r) => [String(r.id), String(r.name)])),
  };
}

function fitsSummaryFor(row: DbRow, maps: NameMaps): string {
  if (row.is_universal) return "Universal fit";

  const modelNames = ((row.compatible_model_ids as string[] | null) ?? [])
    .map((id) => maps.models.get(id))
    .filter((v): v is string => Boolean(v));
  if (modelNames.length) {
    const extra = modelNames.length > 3 ? ` +${modelNames.length - 3} more` : "";
    return `Fits: ${modelNames.slice(0, 3).join(", ")}${extra}`;
  }

  const brandNames = ((row.compatible_brand_ids as string[] | null) ?? [])
    .map((id) => maps.brands.get(id))
    .filter((v): v is string => Boolean(v));
  if (brandNames.length) return `Fits all ${brandNames.slice(0, 2).join(", ")} models`;

  const segments = (row.compatible_segments as string[] | null) ?? [];
  if (segments.length) return `Fits: ${segments.slice(0, 2).join(", ")}`;

  const vtNames = ((row.compatible_vehicle_type_ids as string[] | null) ?? [])
    .map((id) => maps.vehicleTypes.get(id))
    .filter((v): v is string => Boolean(v));
  if (vtNames.length) return `Fits all ${vtNames.join(", ")}`;

  return "Selected vehicles";
}

function toCard(row: DbRow, maps: NameMaps): GearCollectionProductCard {
  return {
    productId: String(row.product_id),
    title: String(row.title),
    slug: String(row.slug),
    price: Number(row.price),
    mrp: Number(row.mrp),
    startingFrom: Boolean(row.starting_from),
    variantCount: Number(row.variant_count ?? 1),
    ratingAvg: Number(row.rating_avg ?? 0),
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : undefined,
    fitsSummary: fitsSummaryFor(row, maps),
  };
}

// --- manual/brand/category collections: an admin-curated, ordered product
// list (gear_collection_products) -- no rule evaluation, just copy-through. ---
async function computeCuratedCards(collectionId: string, maxProducts: number): Promise<GearCollectionProductCard[]> {
  const supabase = getAdminClient();
  const { data: picks, error } = await supabase
    .from("gear_collection_products")
    .select("product_id, sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const productIds = ((picks ?? []) as DbRow[]).map((p) => String(p.product_id)).slice(0, maxProducts);
  if (productIds.length === 0) return [];

  const { data: catalogRows, error: catalogError } = await supabase
    .from("gear_catalog_index")
    .select("*")
    .in("product_id", productIds)
    .eq("status", "live");
  if (catalogError) throw catalogError;

  const rows = (catalogRows ?? []) as DbRow[];
  const byId = new Map(rows.map((r) => [String(r.product_id), r]));
  const maps = await buildFitsSummaryMaps(rows);

  // Preserve the admin's chosen order, not whatever order the catalog query returned.
  return productIds
    .map((id) => byId.get(id))
    .filter((r): r is DbRow => Boolean(r))
    .map((r) => toCard(r, maps));
}

// --- dynamic collections: rule-based, computable only from columns that
// already live flat on gear_catalog_index. "Most viewed"/"growth"-style rules
// need a signal (view counters, sales rollups) this codebase doesn't collect
// yet -- per the source spec's own phasing note, those are deferred, not
// faked. Price/category/brand/discount/tag rules are real and cheap. ---
export type GearCollectionConditions = {
  priceMin?: number;
  priceMax?: number;
  categorySlug?: string;
  brandName?: string;
  minDiscountPct?: number;
  tags?: string[];
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
};

async function computeDynamicCards(conditions: GearCollectionConditions, maxProducts: number): Promise<GearCollectionProductCard[]> {
  const supabase = getAdminClient();
  let query = supabase.from("gear_catalog_index").select("*").eq("status", "live");

  if (conditions.priceMin !== undefined) query = query.gte("price", conditions.priceMin);
  if (conditions.priceMax !== undefined) query = query.lte("price", conditions.priceMax);
  if (conditions.brandName) query = query.eq("brand_name", conditions.brandName);
  if (conditions.tags?.length) query = query.contains("usage_tags", conditions.tags);
  if (conditions.categorySlug) {
    const { data: category } = await supabase
      .from("gear_categories")
      .select("name, level")
      .eq("slug", conditions.categorySlug)
      .maybeSingle();
    if (category) {
      const column = Number((category as DbRow).level) === 2 ? "category_l2" : "category_l1";
      query = query.eq(column, String((category as DbRow).name));
    }
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;

  let rows = (data ?? []) as DbRow[];
  if (conditions.minDiscountPct !== undefined) {
    const threshold = conditions.minDiscountPct;
    rows = rows.filter((r) => {
      const mrp = Number(r.mrp);
      const price = Number(r.price);
      return mrp > 0 && ((mrp - price) / mrp) * 100 >= threshold;
    });
  }

  rows.sort((a, b) => {
    switch (conditions.sort) {
      case "price_asc":
        return Number(a.price) - Number(b.price);
      case "price_desc":
        return Number(b.price) - Number(a.price);
      case "rating":
        return Number(b.rating_avg ?? 0) - Number(a.rating_avg ?? 0);
      default:
        return String(b.updated_at).localeCompare(String(a.updated_at));
    }
  });

  const sliced = rows.slice(0, maxProducts);
  const maps = await buildFitsSummaryMaps(sliced);
  return sliced.map((r) => toCard(r, maps));
}

export async function rebuildCollectionCache(collectionId: string): Promise<{ productCount: number }> {
  const supabase = getAdminClient();
  const { data: collectionRow, error } = await supabase.from("gear_collections").select("*").eq("id", collectionId).maybeSingle();
  if (error) throw error;
  if (!collectionRow) throw new Error("Collection not found");

  const collection = collectionRow as DbRow;
  const now = new Date();
  const startAt = collection.start_at ? new Date(String(collection.start_at)) : null;
  const endAt = collection.end_at ? new Date(String(collection.end_at)) : null;
  const withinSchedule = (!startAt || now >= startAt) && (!endAt || now <= endAt);
  const maxProducts = Number(collection.max_products ?? 12);

  let cards: GearCollectionProductCard[] = [];
  if (collection.is_active && withinSchedule) {
    cards =
      collection.type === "dynamic"
        ? await computeDynamicCards((collection.conditions as GearCollectionConditions) ?? {}, maxProducts)
        : await computeCuratedCards(collectionId, maxProducts);
  }

  const { error: upsertError } = await supabase.from("gear_collection_products_cache").upsert(
    { collection_id: collectionId, product_cards: cards, product_count: cards.length, refreshed_at: new Date().toISOString() },
    { onConflict: "collection_id" },
  );
  if (upsertError) throw upsertError;

  return { productCount: cards.length };
}

// --- Manual bulk rebuild, mirroring rebuildFullCatalogCache -- an
// admin-triggered action, not a cron job. ---
export async function rebuildAllCollectionCaches(): Promise<{ collections: number }> {
  const supabase = getAdminClient();
  const { data: collectionRows, error } = await supabase.from("gear_collections").select("id");
  if (error) throw error;

  const ids = ((collectionRows ?? []) as DbRow[]).map((r) => String(r.id));
  for (const id of ids) {
    await rebuildCollectionCache(id);
  }
  return { collections: ids.length };
}
