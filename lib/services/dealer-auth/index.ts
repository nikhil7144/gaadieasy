import { randomUUID } from "node:crypto";
import { sendTransactionalEmail } from "@/lib/services/email/resend";
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
    verificationStatus: (row.verification_status as DealerBusiness["verificationStatus"]) ?? "pending",
    rejectionReason: optionalStr(row, "rejection_reason"),
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

// --- Pre-account email verification (self-signup) ---
// Same pattern as gear_seller_signup_requests / createPendingSellerSignup in
// lib/services/seller-auth/index.ts: no auth user or dealer_businesses row
// exists until the email is verified, so "change email" is just editing a
// row rather than renaming an already-created account.

async function sendPendingDealerSignupVerificationEmail(email: string, token: string, origin: string) {
  await sendTransactionalEmail({
    to: email,
    subject: "Verify your email to start your dealer signup",
    html: `<p>Click the link below to verify your email and continue creating your dealer account.</p><p><a href="${origin}/dealer/verify-email?token=${token}">Verify email</a></p>`,
  });
}

export async function createPendingDealerSignup(
  businessName: string,
  email: string,
  phone: string | undefined,
  origin: string,
): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingBusinesses } = await supabase.from("dealer_businesses").select("id").eq("email", normalizedEmail).limit(1);
  if (existingBusinesses?.length) throw new Error("An account with this email already exists -- log in instead.");

  const token = randomUUID();
  const { data, error } = await supabase
    .from("dealer_signup_requests")
    .upsert(
      { business_name: businessName, email: normalizedEmail, phone: phone || null, verification_token: token, verified_at: null },
      { onConflict: "email" },
    )
    .select("*")
    .single();
  if (error) throw error;

  await sendPendingDealerSignupVerificationEmail(normalizedEmail, token, origin);
  return { id: (data as DbRow).id as string };
}

export async function updatePendingDealerSignupEmail(pendingId: string, newEmail: string, origin: string): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const normalizedEmail = newEmail.trim().toLowerCase();

  const { data: existingBusinesses } = await supabase.from("dealer_businesses").select("id").eq("email", normalizedEmail).limit(1);
  if (existingBusinesses?.length) throw new Error("An account with this email already exists -- log in instead.");

  const { data: existingPending } = await supabase
    .from("dealer_signup_requests")
    .select("id")
    .eq("email", normalizedEmail)
    .neq("id", pendingId)
    .limit(1);
  if (existingPending?.length) throw new Error("Another signup is already in progress with this email.");

  const token = randomUUID();
  const { data, error } = await supabase
    .from("dealer_signup_requests")
    .update({ email: normalizedEmail, verification_token: token, verified_at: null })
    .eq("id", pendingId)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Signup request not found.");

  await sendPendingDealerSignupVerificationEmail(normalizedEmail, token, origin);
  return { id: (data as DbRow).id as string };
}

export async function getPendingDealerSignup(
  id: string,
): Promise<{ id: string; businessName: string; email: string; verifiedAt?: string } | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.from("dealer_signup_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as DbRow;
  return { id: str(row, "id"), businessName: str(row, "business_name"), email: str(row, "email"), verifiedAt: optionalStr(row, "verified_at") };
}

// Called from /dealer/verify-email?token=... -- marks the pending request
// verified and one-time-clears the token.
export async function verifyPendingDealerSignupToken(token: string): Promise<{ id: string; businessName: string; email: string } | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.from("dealer_signup_requests").select("*").eq("verification_token", token).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: updated, error: updateError } = await supabase
    .from("dealer_signup_requests")
    .update({ verified_at: new Date().toISOString(), verification_token: null })
    .eq("id", (data as DbRow).id)
    .select("*")
    .single();
  if (updateError) throw updateError;

  const row = updated as DbRow;
  return { id: str(row, "id"), businessName: str(row, "business_name"), email: str(row, "email") };
}

// --- Signup completion ---
// Email is already verified (via the pending-signup flow above) by the time
// this runs, so the auth user is created pre-confirmed (email_confirm: true,
// so signInWithPassword works immediately after). The business starts
// verification_status='pending' -- invisible on the public /dealers
// directory until an admin approves it (lib/services/admin-catalog's
// approveDealerBusiness).
export async function signUpDealerBusiness(input: {
  pendingId: string;
  password: string;
  cityId: string;
  area?: string;
  contactPerson?: string;
  phone?: string;
  gstNumber?: string;
  brandIds: string[];
}): Promise<DealerBusiness> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: pendingRow, error: pendingError } = await supabase
    .from("dealer_signup_requests")
    .select("*")
    .eq("id", input.pendingId)
    .maybeSingle();
  if (pendingError) throw pendingError;
  if (!pendingRow) throw new Error("Signup request not found -- start over.");
  const pending = pendingRow as DbRow;
  if (!pending.verified_at) throw new Error("Please verify your email before continuing.");

  const email = str(pending, "email");
  const businessName = str(pending, "business_name");
  const pendingPhone = optionalStr(pending, "phone");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message || "Unable to create dealer account");
  if (!authData.user) throw new Error("Dealer account was not returned by Supabase.");

  const { data: businessRow, error: businessError } = await supabase
    .from("dealer_businesses")
    .insert({
      name: businessName,
      slug: `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 8)}`,
      phone: input.phone || pendingPhone || null,
      email,
      active: true,
      verified: false,
      verification_status: "pending",
    })
    .select("*")
    .single();
  if (businessError) throw businessError;
  const business = businessRow as DbRow;

  const { error: dealerUserError } = await supabase.from("dealer_users").insert({
    user_id: authData.user.id,
    dealer_business_id: business.id,
    dealer_id: null,
    role: "dealer_business_admin",
    active: true,
  });
  if (dealerUserError) throw dealerUserError;

  const { data: showroomRow, error: showroomError } = await supabase
    .from("dealers")
    .insert({
      dealer_business_id: business.id,
      name: businessName,
      slug: `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${randomUUID().slice(0, 8)}`,
      city_id: input.cityId,
      area: input.area || null,
      contact_person: input.contactPerson || null,
      phone: input.phone || pendingPhone || null,
      email,
      gst_number: input.gstNumber || null,
      active: true,
      verified: false,
      priority: 0,
    })
    .select("*")
    .single();
  if (showroomError) throw showroomError;
  const showroom = showroomRow as DbRow;

  if (input.brandIds.length) {
    const mappingRows = input.brandIds.map((brandId) => ({
      dealer_id: showroom.id,
      brand_id: brandId,
      city_id: input.cityId,
      active: true,
    }));
    const { error: mappingError } = await supabase.from("dealer_brand_mappings").insert(mappingRows);
    if (mappingError) throw mappingError;
  }

  await supabase.from("dealer_signup_requests").delete().eq("id", input.pendingId);

  return mapDealerBusiness(business);
}
