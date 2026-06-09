import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Offer } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function str(row: DbRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function optionalStr(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function num(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function bool(row: DbRow, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function mapOffer(row: DbRow): Offer {
  return {
    id: str(row, "id"),
    title: str(row, "title"),
    description: optionalStr(row, "description"),
    dealerBusinessId: optionalStr(row, "dealer_business_id"),
    dealerId: optionalStr(row, "dealer_id"),
    brandId: optionalStr(row, "brand_id"),
    modelId: optionalStr(row, "model_id"),
    cityId: optionalStr(row, "city_id"),
    discountAmount: num(row, "discount_amount"),
    sponsorType: str(row, "sponsor_type", "dealer") as Offer["sponsorType"],
    placement: str(row, "placement", "dealer_card") as Offer["placement"],
    approvalStatus: str(row, "approval_status", "pending") as Offer["approvalStatus"],
    createdByDealerUserId: optionalStr(row, "created_by_dealer_user_id"),
    startDate: optionalStr(row, "start_date"),
    endDate: optionalStr(row, "end_date"),
    active: bool(row, "active", true),
    createdAt: optionalStr(row, "created_at"),
  };
}

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

export async function getAdminOffers() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("offers").select("*");

  if (error || !data) return [];
  return (data as DbRow[])
    .map(mapOffer)
    .sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1, rejected: 2 } as const;
      const aRank = statusOrder[(a.approvalStatus ?? "pending") as keyof typeof statusOrder] ?? 9;
      const bRank = statusOrder[(b.approvalStatus ?? "pending") as keyof typeof statusOrder] ?? 9;
      if (aRank !== bRank) return aRank - bRank;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
}

export async function updateAdminOffer(input: {
  id: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  active?: boolean;
}) {
  const supabase = getAdminClient();
  const patch: DbRow = {};

  if (input.approvalStatus !== undefined) patch.approval_status = input.approvalStatus;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase.from("offers").update(patch).eq("id", input.id).select("*").single();
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/offers");
  revalidatePath("/dealer");

  return mapOffer(data as DbRow);
}
