import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PriceBreakdown } from "@/types/automobile";

type CacheRow = {
  variant_id: string;
  city_id: string;
  ex_showroom: number;
  road_tax: number;
  registration_fee: number;
  insurance: number;
  smart_card_fee: number;
  number_plate_fee: number;
  hypothecation_fee: number;
  fastag_fee: number;
  handling_charges: number;
  offer_discount: number;
  on_road_total: number;
};

function rowToBreakdown(row: CacheRow): PriceBreakdown {
  return {
    exShowroomPrice: Number(row.ex_showroom),
    roadTax: Number(row.road_tax),
    registrationFee: Number(row.registration_fee),
    insurance: Number(row.insurance),
    smartCardFee: Number(row.smart_card_fee),
    numberPlateFee: Number(row.number_plate_fee),
    hypothecationFee: Number(row.hypothecation_fee),
    fastagFee: Number(row.fastag_fee),
    handlingCharges: Number(row.handling_charges),
    offerDiscount: Number(row.offer_discount),
    totalOnRoadPrice: Number(row.on_road_total),
  };
}

function breakdownToRow(variantId: string, cityId: string, b: PriceBreakdown) {
  return {
    variant_id: variantId,
    city_id: cityId,
    ex_showroom: b.exShowroomPrice,
    road_tax: b.roadTax,
    registration_fee: b.registrationFee,
    insurance: b.insurance,
    smart_card_fee: b.smartCardFee,
    number_plate_fee: b.numberPlateFee,
    hypothecation_fee: b.hypothecationFee,
    fastag_fee: b.fastagFee,
    handling_charges: b.handlingCharges,
    offer_discount: b.offerDiscount,
    on_road_total: b.totalOnRoadPrice,
    computed_at: new Date().toISOString(),
  };
}

export async function getCachedPricing(variantId: string, cityId: string): Promise<PriceBreakdown | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("vehicle_pricing_cache")
    .select("*")
    .eq("variant_id", variantId)
    .eq("city_id", cityId)
    .single();
  return data ? rowToBreakdown(data as CacheRow) : null;
}

export async function batchGetCachedPricing(variantIds: string[], cityId: string): Promise<Map<string, PriceBreakdown>> {
  const supabase = createSupabaseAdminClient();
  const result = new Map<string, PriceBreakdown>();
  if (!supabase || !variantIds.length) return result;
  const { data } = await supabase
    .from("vehicle_pricing_cache")
    .select("*")
    .eq("city_id", cityId)
    .in("variant_id", variantIds);
  for (const row of data ?? []) {
    result.set(String((row as CacheRow).variant_id), rowToBreakdown(row as CacheRow));
  }
  return result;
}

export async function setCachedPricing(variantId: string, cityId: string, breakdown: PriceBreakdown): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase
    .from("vehicle_pricing_cache")
    .upsert(breakdownToRow(variantId, cityId, breakdown), { onConflict: "variant_id,city_id" });
}

export async function batchSetCachedPricing(
  rows: Array<{ variantId: string; cityId: string; breakdown: PriceBreakdown }>,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !rows.length) return;
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH).map((r) => breakdownToRow(r.variantId, r.cityId, r.breakdown));
    await supabase.from("vehicle_pricing_cache").upsert(batch, { onConflict: "variant_id,city_id" });
  }
}

export async function invalidateCacheForVariant(variantId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("vehicle_pricing_cache").delete().eq("variant_id", variantId);
}

export async function invalidateCacheForState(stateId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { data: cityRows } = await supabase.from("cities").select("id").eq("state_id", stateId);
  if (!cityRows?.length) return;
  const cityIds = cityRows.map((c) => String(c.id));
  await supabase.from("vehicle_pricing_cache").delete().in("city_id", cityIds);
}
