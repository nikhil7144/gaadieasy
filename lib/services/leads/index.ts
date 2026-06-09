import { leads as seedLeads } from "@/lib/data";
import { getDealerAccessContext, type DealerAccessContext } from "@/lib/services/dealer-auth";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PublicLeadInput } from "@/lib/validations/lead";
import type { Dealer, VehicleLead } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function str(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function optionalStr(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function num(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function mapLead(row: DbRow): VehicleLead {
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    phone: str(row, "phone"),
    email: optionalStr(row, "email"),
    cityId: str(row, "city_id"),
    brandId: str(row, "brand_id"),
    modelId: str(row, "model_id"),
    variantId: str(row, "variant_id"),
    selectedOnRoadPrice: num(row, "selected_onroad_price"),
    preferredContactTime: optionalStr(row, "preferred_contact_time"),
    message: optionalStr(row, "message"),
    assignedDealerBusinessId: optionalStr(row, "assigned_dealer_business_id"),
    assignedDealerId: optionalStr(row, "assigned_dealer_id"),
    assignedDealerUserId: optionalStr(row, "assigned_dealer_user_id"),
    status: str(row, "status") as VehicleLead["status"],
    source: str(row, "source") as VehicleLead["source"],
    createdAt: str(row, "created_at"),
  };
}

function findDealerForLead(data: Awaited<ReturnType<typeof getVehicleDataSet>>, brandId: string, cityId: string) {
  const mapping = data.dealerBrandMappings
    .filter((item) => item.active && item.brandId === brandId && item.cityId === cityId)
    .sort((a, b) => {
      const dealerA = data.dealers.find((dealer) => dealer.id === a.dealerId)?.priority ?? 0;
      const dealerB = data.dealers.find((dealer) => dealer.id === b.dealerId)?.priority ?? 0;
      return dealerB - dealerA;
    })[0];

  if (!mapping) return undefined;

  return data.dealers.find((dealer) => dealer.id === mapping.dealerId && dealer.active && dealer.verified);
}

export async function createVehicleLead(input: PublicLeadInput) {
  const supabase = createSupabaseAdminClient();
  const data = await getVehicleDataSet();
  const dealer = findDealerForLead(data, input.brandId, input.cityId);

  const payload = {
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    city_id: input.cityId,
    brand_id: input.brandId,
    model_id: input.modelId,
    variant_id: input.variantId,
    selected_onroad_price: input.selectedOnRoadPrice,
    preferred_contact_time: input.preferredContactTime || null,
    message: input.message || null,
    assigned_dealer_business_id: dealer?.dealerBusinessId ?? null,
    assigned_dealer_id: dealer?.id ?? null,
    status: dealer ? "assigned" : "new",
    source: input.source,
  };

  if (!supabase) {
    const fallbackLead: VehicleLead = {
      id: `lead-${Date.now()}`,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      cityId: input.cityId,
      brandId: input.brandId,
      modelId: input.modelId,
      variantId: input.variantId,
      selectedOnRoadPrice: input.selectedOnRoadPrice,
      preferredContactTime: input.preferredContactTime,
      message: input.message,
      assignedDealerBusinessId: dealer?.dealerBusinessId,
      assignedDealerId: dealer?.id,
      status: dealer ? "assigned" : "new",
      source: input.source,
      createdAt: new Date().toISOString(),
    };
    seedLeads.unshift(fallbackLead);
    return { lead: fallbackLead, dealer, routedToAdmin: true };
  }

  const { data: inserted, error } = await supabase.from("vehicle_leads").insert(payload).select("*").single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Unable to create lead");
  }

  return { lead: mapLead(inserted as DbRow), dealer, routedToAdmin: true };
}

export async function getAdminLeads() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return seedLeads;

  const { data, error } = await supabase
    .from("vehicle_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as DbRow[]).map(mapLead);
}

export async function getDealerLeadsForContext(context?: DealerAccessContext | null) {
  const access = context ?? (await getDealerAccessContext());
  const supabase = createSupabaseAdminClient();

  if (!access || !supabase) return [];

  let query = supabase.from("vehicle_leads").select("*").order("created_at", { ascending: false });

  if (access.dealerUser.role === "dealer_business_admin") {
    query = query.eq("assigned_dealer_business_id", access.dealerUser.dealerBusinessId);
  } else if (access.dealerUser.dealerId) {
    query = query.eq("assigned_dealer_id", access.dealerUser.dealerId);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as DbRow[]).map(mapLead);
}

export async function updateDealerLeadStatus(leadId: string, status: VehicleLead["status"], context?: DealerAccessContext | null) {
  const access = context ?? (await getDealerAccessContext());
  const supabase = createSupabaseAdminClient();

  if (!access || !supabase) return undefined;

  const allowedDealerIds = access.allowedDealerIds;
  const { data: leadRows } = await supabase.from("vehicle_leads").select("*").eq("id", leadId).limit(1);
  const leadRow = leadRows?.[0] as DbRow | undefined;
  if (!leadRow) return undefined;

  const assignedDealerId = optionalStr(leadRow, "assigned_dealer_id");
  const assignedBusinessId = optionalStr(leadRow, "assigned_dealer_business_id");
  const canUpdate =
    access.dealerUser.role === "dealer_business_admin"
      ? assignedBusinessId === access.dealerUser.dealerBusinessId
      : assignedDealerId !== undefined && allowedDealerIds.includes(assignedDealerId);

  if (!canUpdate) return undefined;

  const { data, error } = await supabase
    .from("vehicle_leads")
    .update({ status })
    .eq("id", leadId)
    .select("*")
    .single();

  if (error || !data) return undefined;
  return mapLead(data as DbRow);
}

export function describeAssignedDealer(lead: VehicleLead, dealers: Dealer[]) {
  return dealers.find((dealer) => dealer.id === lead.assignedDealerId)?.name ?? "Admin only";
}
