import { revalidateCatalog } from "@/lib/services/catalog-cache";
import { getDealerAccessContext, type DealerAccessContext } from "@/lib/services/dealer-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Offer } from "@/types/automobile";

type DbRow = Record<string, unknown>;

export type DealerOfferInput = {
  title: string;
  description?: string;
  dealerId?: string;
  brandId?: string;
  modelId?: string;
  cityId?: string;
  discountAmount: number;
  startDate?: string;
  endDate?: string;
};

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

function resolveShowroomId(context: DealerAccessContext, requestedDealerId?: string) {
  if (context.dealerUser.role === "dealer_showroom_user") {
    return context.dealerUser.dealerId;
  }

  if (!requestedDealerId) return undefined;
  return context.allowedDealerIds.includes(requestedDealerId) ? requestedDealerId : undefined;
}

export async function getDealerOffersForContext(context?: DealerAccessContext | null) {
  const access = context ?? (await getDealerAccessContext());
  const supabase = createSupabaseAdminClient();

  if (!access || !supabase) return [];

  let query = supabase
    .from("offers")
    .select("*")
    .eq("dealer_business_id", access.dealerUser.dealerBusinessId);

  if (access.dealerUser.role === "dealer_showroom_user" && access.dealerUser.dealerId) {
    query = query.eq("dealer_id", access.dealerUser.dealerId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as DbRow[]).map(mapOffer);
}

export async function createDealerOffer(input: DealerOfferInput, context?: DealerAccessContext | null) {
  const access = context ?? (await getDealerAccessContext());
  const supabase = createSupabaseAdminClient();

  if (!access || !supabase) {
    throw new Error("Dealer access is required");
  }

  const dealerId = resolveShowroomId(access, input.dealerId);
  if (input.dealerId && !dealerId) {
    throw new Error("Selected showroom is outside this dealer business");
  }

  const payload = {
    title: input.title,
    description: input.description || null,
    dealer_business_id: access.dealerUser.dealerBusinessId,
    dealer_id: dealerId ?? null,
    brand_id: input.brandId || null,
    model_id: input.modelId || null,
    city_id: input.cityId || null,
    discount_amount: input.discountAmount,
    sponsor_type: "dealer",
    placement: "dealer_card",
    approval_status: "pending",
    created_by_dealer_user_id: access.dealerUser.id,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    active: true,
  };

  const { data, error } = await supabase.from("offers").insert(payload).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create offer");

  // Dealer offers feed the on-road price breakdown, which is tag-cached.
  revalidateCatalog();

  return mapOffer(data as DbRow);
}
