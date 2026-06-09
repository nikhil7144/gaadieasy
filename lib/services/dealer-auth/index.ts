import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Dealer, DealerBusiness, DealerUser } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function str(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

function optionalStr(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function bool(row: DbRow, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function num(row: DbRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

function mapDealerUser(row: DbRow): DealerUser {
  return {
    id: str(row, "id"),
    userId: str(row, "user_id"),
    dealerBusinessId: str(row, "dealer_business_id"),
    dealerId: optionalStr(row, "dealer_id"),
    role: str(row, "role") as DealerUser["role"],
    active: bool(row, "active", true),
    createdAt: optionalStr(row, "created_at"),
  };
}

function mapDealerBusiness(row: DbRow): DealerBusiness {
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    slug: str(row, "slug"),
    logoUrl: optionalStr(row, "logo_url"),
    phone: optionalStr(row, "phone"),
    email: optionalStr(row, "email"),
    active: bool(row, "active", true),
    verified: bool(row, "verified"),
    createdAt: optionalStr(row, "created_at"),
  };
}

function mapDealer(row: DbRow): Dealer {
  return {
    id: str(row, "id"),
    dealerBusinessId: optionalStr(row, "dealer_business_id"),
    name: str(row, "name"),
    slug: str(row, "slug"),
    logoUrl: optionalStr(row, "logo_url"),
    cityId: str(row, "city_id"),
    area: str(row, "area"),
    contactPerson: str(row, "contact_person"),
    phone: str(row, "phone"),
    email: str(row, "email"),
    gstNumber: optionalStr(row, "gst_number"),
    active: bool(row, "active", true),
    verified: bool(row, "verified"),
    priority: num(row, "priority"),
  };
}

export type DealerAccessContext = {
  userEmail?: string;
  dealerUser: DealerUser;
  business: DealerBusiness;
  showroom?: Dealer;
  showrooms: Dealer[];
  allowedDealerIds: string[];
};

export async function getDealerAccessContext(): Promise<DealerAccessContext | null> {
  const serverSupabase = await createServerSupabaseClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!serverSupabase || !adminSupabase) return null;

  const { data: authData } = await serverSupabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data: dealerUserRows } = await adminSupabase
    .from("dealer_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const dealerUserRow = dealerUserRows?.[0] as DbRow | undefined;
  if (!dealerUserRow) return null;

  const dealerUser = mapDealerUser(dealerUserRow);

  const { data: businessRows } = await adminSupabase
    .from("dealer_businesses")
    .select("*")
    .eq("id", dealerUser.dealerBusinessId)
    .eq("active", true)
    .limit(1);

  const businessRow = businessRows?.[0] as DbRow | undefined;
  if (!businessRow) return null;

  const { data: showroomRows } = await adminSupabase
    .from("dealers")
    .select("*")
    .eq("dealer_business_id", dealerUser.dealerBusinessId)
    .eq("active", true)
    .order("priority", { ascending: false });

  const showrooms = ((showroomRows ?? []) as DbRow[]).map(mapDealer);
  const showroom = dealerUser.dealerId ? showrooms.find((item) => item.id === dealerUser.dealerId) : undefined;
  const allowedDealerIds =
    dealerUser.role === "dealer_business_admin"
      ? showrooms.map((item) => item.id)
      : dealerUser.dealerId
        ? [dealerUser.dealerId]
        : [];

  return {
    userEmail: user.email,
    dealerUser,
    business: mapDealerBusiness(businessRow),
    showroom,
    showrooms,
    allowedDealerIds,
  };
}
