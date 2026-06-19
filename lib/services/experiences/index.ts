import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export type Experience = {
  id: string;
  dealerName: string;
  dealerCity: string;
  dealerBrand?: string;
  dealerSlug: string;
  modelId?: string;
  vehicleModel?: string;
  vehicleVariant?: string;
  purchaseYear?: number;
  visitType?: string;
  reviewerName: string;
  emailVerified: boolean;
  overallRating: number;
  salesRating?: number;
  serviceRating?: number;
  waitTimeRating?: number;
  priceTransparencyRating?: number;
  title?: string;
  pros?: string;
  cons?: string;
  body?: string;
  createdAt: string;
};

export type ExperienceSummary = {
  count: number;
  averageOverall: number;
  averageSales: number;
  averageService: number;
  averageWaitTime: number;
  averagePriceTransparency: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

const PUBLIC_COLUMNS = [
  "id", "dealer_name", "dealer_city", "dealer_brand", "dealer_slug",
  "model_id", "vehicle_model", "vehicle_variant", "purchase_year", "visit_type",
  "reviewer_name", "email_verified", "overall_rating", "sales_rating",
  "service_rating", "wait_time_rating", "price_transparency_rating",
  "title", "pros", "cons", "body", "created_at",
].join(", ");

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildDealerSlug(dealerName: string, city: string) {
  return `${slugify(dealerName)}-${slugify(city)}`;
}

type DbRow = Record<string, unknown>;

function mapExperience(row: DbRow): Experience {
  return {
    id: String(row.id),
    dealerName: String(row.dealer_name),
    dealerCity: String(row.dealer_city),
    dealerBrand: row.dealer_brand ? String(row.dealer_brand) : undefined,
    dealerSlug: String(row.dealer_slug),
    modelId: row.model_id ? String(row.model_id) : undefined,
    vehicleModel: row.vehicle_model ? String(row.vehicle_model) : undefined,
    vehicleVariant: row.vehicle_variant ? String(row.vehicle_variant) : undefined,
    purchaseYear: row.purchase_year ? Number(row.purchase_year) : undefined,
    visitType: row.visit_type ? String(row.visit_type) : undefined,
    reviewerName: String(row.reviewer_name),
    emailVerified: Boolean(row.email_verified),
    overallRating: Number(row.overall_rating),
    salesRating: row.sales_rating != null ? Number(row.sales_rating) : undefined,
    serviceRating: row.service_rating != null ? Number(row.service_rating) : undefined,
    waitTimeRating: row.wait_time_rating != null ? Number(row.wait_time_rating) : undefined,
    priceTransparencyRating: row.price_transparency_rating != null ? Number(row.price_transparency_rating) : undefined,
    title: row.title ? String(row.title) : undefined,
    pros: row.pros ? String(row.pros) : undefined,
    cons: row.cons ? String(row.cons) : undefined,
    body: row.body ? String(row.body) : undefined,
    createdAt: String(row.created_at),
  };
}

export async function getExperiences(filters?: {
  city?: string;
  brand?: string;
  q?: string;
  limit?: number;
}): Promise<Experience[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  let query = supabase
    .from("experiences")
    .select(PUBLIC_COLUMNS)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 24);

  if (filters?.city) query = query.ilike("dealer_city", filters.city);
  if (filters?.brand) query = query.ilike("dealer_brand", filters.brand);
  if (filters?.q) query = query.ilike("dealer_name", `%${filters.q}%`);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as DbRow[]).map(mapExperience);
}

export async function getExperiencesByVehicleModel(modelId: string, modelName: string): Promise<Experience[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("experiences")
    .select(PUBLIC_COLUMNS)
    .eq("active", true)
    .or(`model_id.eq.${modelId},vehicle_model.ilike.%${modelName}%`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as DbRow[]).map(mapExperience);
}

export async function getExperiencesByDealerSlug(slug: string): Promise<Experience[]> {
  const supabase = getAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("experiences")
    .select(PUBLIC_COLUMNS)
    .eq("dealer_slug", slug)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as DbRow[]).map(mapExperience);
}

export function summariseExperiences(experiences: Experience[]): ExperienceSummary | null {
  if (!experiences.length) return null;

  const avg = (vals: (number | undefined)[]) => {
    const valid = vals.filter((v): v is number => v != null);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  experiences.forEach((e) => { dist[e.overallRating] = (dist[e.overallRating] ?? 0) + 1; });

  return {
    count: experiences.length,
    averageOverall: avg(experiences.map((e) => e.overallRating)),
    averageSales: avg(experiences.map((e) => e.salesRating)),
    averageService: avg(experiences.map((e) => e.serviceRating)),
    averageWaitTime: avg(experiences.map((e) => e.waitTimeRating)),
    averagePriceTransparency: avg(experiences.map((e) => e.priceTransparencyRating)),
    distribution: dist as Record<1 | 2 | 3 | 4 | 5, number>,
  };
}

export async function submitExperience(input: {
  dealerName: string;
  dealerCity: string;
  dealerBrand?: string;
  modelId?: string;
  vehicleModel?: string;
  vehicleVariant?: string;
  purchaseYear?: number;
  visitType?: string;
  reviewerName: string;
  reviewerEmail?: string;
  overallRating: number;
  salesRating?: number;
  serviceRating?: number;
  waitTimeRating?: number;
  priceTransparencyRating?: number;
  title?: string;
  pros?: string;
  cons?: string;
  body?: string;
}): Promise<Experience> {
  const supabase = createSupabaseAdminClient() ?? getAnonClient();
  if (!supabase) throw new Error("Service unavailable.");

  const dealerSlug = buildDealerSlug(input.dealerName, input.dealerCity);

  const { data, error } = await supabase
    .from("experiences")
    .insert({
      dealer_name: input.dealerName.trim(),
      dealer_city: input.dealerCity.trim(),
      dealer_brand: input.dealerBrand?.trim() || null,
      dealer_slug: dealerSlug,
      model_id: input.modelId || null,
      vehicle_model: input.vehicleModel?.trim() || null,
      vehicle_variant: input.vehicleVariant?.trim() || null,
      purchase_year: input.purchaseYear ?? null,
      visit_type: input.visitType || null,
      reviewer_name: input.reviewerName.trim(),
      reviewer_email: input.reviewerEmail?.trim().toLowerCase() || null,
      overall_rating: input.overallRating,
      sales_rating: input.salesRating ?? null,
      service_rating: input.serviceRating ?? null,
      wait_time_rating: input.waitTimeRating ?? null,
      price_transparency_rating: input.priceTransparencyRating ?? null,
      title: input.title?.trim() || null,
      pros: input.pros?.trim() || null,
      cons: input.cons?.trim() || null,
      body: input.body?.trim() || null,
      active: true,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapExperience(data as DbRow);
}
