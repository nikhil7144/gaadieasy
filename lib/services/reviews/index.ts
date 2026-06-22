import { revalidatePath, unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

// server-side (service role) — used for writes from API routes
function getServerClient() {
  return createSupabaseAdminClient();
}

export type VehicleReview = {
  id: string;
  modelId: string;
  variantId?: string;
  userName: string;
  city?: string;
  ownedFor?: string;
  overallRating: number;
  engineRating?: number;
  dealerRating?: number;
  comfortRating?: number;
  valueRating?: number;
  pros?: string;
  cons?: string;
  body?: string;
  active: boolean;
  createdAt: string;
};

type DbRow = Record<string, unknown>;

function mapReview(row: DbRow): VehicleReview {
  return {
    id: String(row.id),
    modelId: String(row.model_id),
    variantId: row.variant_id ? String(row.variant_id) : undefined,
    userName: String(row.user_name),
    city: row.city ? String(row.city) : undefined,
    ownedFor: row.owned_for ? String(row.owned_for) : undefined,
    overallRating: Number(row.overall_rating),
    engineRating: row.engine_rating != null ? Number(row.engine_rating) : undefined,
    dealerRating: row.dealer_rating != null ? Number(row.dealer_rating) : undefined,
    comfortRating: row.comfort_rating != null ? Number(row.comfort_rating) : undefined,
    valueRating: row.value_rating != null ? Number(row.value_rating) : undefined,
    pros: row.pros ? String(row.pros) : undefined,
    cons: row.cons ? String(row.cons) : undefined,
    body: row.body ? String(row.body) : undefined,
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const getReviewsForModel = unstable_cache(
  async (modelId: string): Promise<VehicleReview[]> => {
    const supabase = getAnonClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("vehicle_reviews")
      .select("*")
      .eq("model_id", modelId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return (data as unknown as DbRow[]).map(mapReview);
  },
  ["vehicle-reviews"],
  { revalidate: 60 },
);

export type ReviewSummary = {
  count: number;
  averageOverall: number;
  averageEngine: number;
  averageDealer: number;
  averageComfort: number;
  averageValue: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export function summariseReviews(reviews: VehicleReview[]): ReviewSummary | null {
  if (!reviews.length) return null;

  const avg = (vals: (number | undefined)[]) => {
    const valid = vals.filter((v): v is number => v != null);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { dist[r.overallRating] = (dist[r.overallRating] ?? 0) + 1; });

  return {
    count: reviews.length,
    averageOverall: avg(reviews.map((r) => r.overallRating)),
    averageEngine: avg(reviews.map((r) => r.engineRating)),
    averageDealer: avg(reviews.map((r) => r.dealerRating)),
    averageComfort: avg(reviews.map((r) => r.comfortRating)),
    averageValue: avg(reviews.map((r) => r.valueRating)),
    distribution: dist as Record<1 | 2 | 3 | 4 | 5, number>,
  };
}

export async function submitReview(input: {
  modelId: string;
  variantId?: string;
  userName: string;
  city?: string;
  ownedFor?: string;
  overallRating: number;
  engineRating?: number;
  dealerRating?: number;
  comfortRating?: number;
  valueRating?: number;
  pros?: string;
  cons?: string;
  body?: string;
}) {
  // Use admin (service role) client for writes — this runs server-side inside the API route,
  // so the service key is available and avoids anon-key RLS/network issues.
  const supabase = getServerClient() ?? getAnonClient();
  if (!supabase) throw new Error("Service unavailable.");

  const { data, error } = await supabase
    .from("vehicle_reviews")
    .insert({
      model_id: input.modelId,
      variant_id: input.variantId ?? null,
      user_name: input.userName.trim(),
      city: input.city?.trim() || null,
      owned_for: input.ownedFor?.trim() || null,
      overall_rating: input.overallRating,
      engine_rating: input.engineRating ?? null,
      dealer_rating: input.dealerRating ?? null,
      comfort_rating: input.comfortRating ?? null,
      value_rating: input.valueRating ?? null,
      pros: input.pros?.trim() || null,
      cons: input.cons?.trim() || null,
      body: input.body?.trim() || null,
      active: true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/on-road-price");
  return mapReview(data as DbRow);
}
