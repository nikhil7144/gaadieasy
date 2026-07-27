import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/services/email/resend";
import type { Seller, SellerBankDetails, SellerKycDocument, SellerShippingSettingsRecord, SellerUser } from "@/types/automobile";

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

function mapSellerUser(row: DbRow): SellerUser {
  return {
    id: str(row, "id"),
    userId: str(row, "user_id"),
    sellerId: str(row, "seller_id"),
    role: str(row, "role") as SellerUser["role"],
    active: bool(row, "active", true),
    createdAt: optionalStr(row, "created_at"),
  };
}

function mapSeller(row: DbRow): Seller {
  return {
    id: str(row, "id"),
    businessName: str(row, "business_name"),
    brandName: optionalStr(row, "brand_name"),
    businessType: optionalStr(row, "business_type"),
    gstin: optionalStr(row, "gstin"),
    pan: optionalStr(row, "pan"),
    kycStatus: (str(row, "kyc_status") || "pending_review") as Seller["kycStatus"],
    kycRejectionReason: optionalStr(row, "kyc_rejection_reason"),
    contactEmail: optionalStr(row, "contact_email"),
    contactPhone: optionalStr(row, "contact_phone"),
    logoUrl: optionalStr(row, "logo_url"),
    bannerUrl: optionalStr(row, "banner_url"),
    about: optionalStr(row, "about"),
    status: (str(row, "status") || "onboarding") as Seller["status"],
    commissionPct: num(row, "commission_pct", 10),
    createdAt: str(row, "created_at"),
    interestedCategoryIds: Array.isArray(row.interested_category_ids) ? (row.interested_category_ids as string[]) : [],
    emailVerifiedAt: optionalStr(row, "email_verified_at"),
  };
}

export async function updateSellerCategoryInterest(sellerId: string, categoryIds: string[]): Promise<Seller> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase
    .from("sellers")
    .update({ interested_category_ids: categoryIds })
    .eq("id", sellerId)
    .select("*")
    .single();

  if (error) throw error;
  return mapSeller(data as DbRow);
}

export type SellerAccessContext = {
  userEmail?: string;
  sellerUser: SellerUser;
  seller: Seller;
};

export async function getSellerAccessContext(): Promise<SellerAccessContext | null> {
  const serverSupabase = await createServerSupabaseClient();
  const adminSupabase = createSupabaseAdminClient();

  if (!serverSupabase || !adminSupabase) return null;

  const { data: authData } = await serverSupabase.auth.getUser();
  const user = authData.user;
  if (!user) return null;

  const { data: sellerUserRows } = await adminSupabase
    .from("seller_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  const sellerUserRow = sellerUserRows?.[0] as DbRow | undefined;
  if (!sellerUserRow) return null;

  const sellerUser = mapSellerUser(sellerUserRow);

  const { data: sellerRows } = await adminSupabase.from("sellers").select("*").eq("id", sellerUser.sellerId).limit(1);

  const sellerRow = sellerRows?.[0] as DbRow | undefined;
  if (!sellerRow) return null;

  return {
    userEmail: user.email,
    sellerUser,
    seller: mapSeller(sellerRow),
  };
}

// --- Pre-account email verification ---
// The seller's real account (auth user + `sellers` row) is only created once
// the email is verified -- this table holds their email/business name in the
// meantime, so "change email" is just editing a row rather than renaming an
// already-created auth account. Consumed (deleted) by signUpSeller below.

async function sendPendingSignupVerificationEmail(email: string, token: string, origin: string) {
  await sendTransactionalEmail({
    to: email,
    subject: "Verify your email to start your GaadiGear seller signup",
    html: `<p>Click the link below to verify your email and continue creating your GaadiGear seller account.</p><p><a href="${origin}/gaadigear/sell/verify-email?token=${token}">Verify email</a></p>`,
  });
}

export async function createPendingSellerSignup(businessName: string, email: string, origin: string): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingSellers } = await supabase.from("sellers").select("id").eq("contact_email", normalizedEmail).limit(1);
  if (existingSellers?.length) throw new Error("An account with this email already exists -- log in instead.");

  const token = randomUUID();
  const { data, error } = await supabase
    .from("gear_seller_signup_requests")
    .upsert(
      { business_name: businessName, email: normalizedEmail, verification_token: token, verified_at: null },
      { onConflict: "email" },
    )
    .select("*")
    .single();
  if (error) throw error;

  await sendPendingSignupVerificationEmail(normalizedEmail, token, origin);
  return { id: (data as DbRow).id as string };
}

export async function updatePendingSellerSignupEmail(pendingId: string, newEmail: string, origin: string): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const normalizedEmail = newEmail.trim().toLowerCase();

  const { data: existingSellers } = await supabase.from("sellers").select("id").eq("contact_email", normalizedEmail).limit(1);
  if (existingSellers?.length) throw new Error("An account with this email already exists -- log in instead.");

  const { data: existingPending } = await supabase
    .from("gear_seller_signup_requests")
    .select("id")
    .eq("email", normalizedEmail)
    .neq("id", pendingId)
    .limit(1);
  if (existingPending?.length) throw new Error("Another signup is already in progress with this email.");

  const token = randomUUID();
  const { data, error } = await supabase
    .from("gear_seller_signup_requests")
    .update({ email: normalizedEmail, verification_token: token, verified_at: null })
    .eq("id", pendingId)
    .select("*")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Signup request not found.");

  await sendPendingSignupVerificationEmail(normalizedEmail, token, origin);
  return { id: (data as DbRow).id as string };
}

export async function getPendingSellerSignup(id: string): Promise<{ id: string; businessName: string; email: string; verifiedAt?: string } | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.from("gear_seller_signup_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as DbRow;
  return { id: str(row, "id"), businessName: str(row, "business_name"), email: str(row, "email"), verifiedAt: optionalStr(row, "verified_at") };
}

// Called from /gaadigear/sell/verify-email?token=... for the pre-account
// path -- marks the pending request verified and one-time-clears the token.
export async function verifyPendingSellerSignupToken(token: string): Promise<{ id: string; businessName: string; email: string } | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  const { data, error } = await supabase.from("gear_seller_signup_requests").select("*").eq("verification_token", token).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: updated, error: updateError } = await supabase
    .from("gear_seller_signup_requests")
    .update({ verified_at: new Date().toISOString(), verification_token: null })
    .eq("id", (data as DbRow).id)
    .select("*")
    .single();
  if (updateError) throw updateError;

  const row = updated as DbRow;
  return { id: str(row, "id"), businessName: str(row, "business_name"), email: str(row, "email") };
}

// --- Signup ---
// Public self-signup is new to this codebase (dealers have no equivalent -- dealer
// logins are only ever admin-created). The seller's email is already verified
// (via the pending-signup flow above) by the time this runs, so the auth user
// is created pre-confirmed (email_confirm: true, so signInWithPassword works
// immediately after) with sellers.email_verified_at stamped from the pending
// request -- no separate verification email needed for this path.
export async function signUpSeller(input: { pendingId: string; password: string; contactPhone?: string }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: pendingRow, error: pendingError } = await supabase
    .from("gear_seller_signup_requests")
    .select("*")
    .eq("id", input.pendingId)
    .maybeSingle();
  if (pendingError) throw pendingError;
  if (!pendingRow) throw new Error("Signup request not found -- start over.");
  const pending = pendingRow as DbRow;
  if (!pending.verified_at) throw new Error("Please verify your email before continuing.");

  const email = str(pending, "email");
  const businessName = str(pending, "business_name");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });

  if (authError) throw new Error(authError.message || "Unable to create seller account");
  if (!authData.user) throw new Error("Seller account was not returned by Supabase.");

  const { data: sellerRow, error: sellerError } = await supabase
    .from("sellers")
    .insert({
      business_name: businessName,
      contact_email: email,
      contact_phone: input.contactPhone || null,
      status: "onboarding",
      kyc_status: "pending_review",
      email_verified_at: pending.verified_at,
    })
    .select("*")
    .single();

  if (sellerError) throw sellerError;

  const { error: sellerUserError } = await supabase.from("seller_users").insert({
    user_id: authData.user.id,
    seller_id: (sellerRow as DbRow).id,
    role: "seller_owner",
    active: true,
  });

  if (sellerUserError) throw sellerUserError;

  await supabase.from("gear_seller_signup_requests").delete().eq("id", input.pendingId);

  return mapSeller(sellerRow as DbRow);
}

// Generates a fresh token, stores it on the seller row, and emails a
// verification link directly via Resend (lib/services/email/resend) --
// deliberately not Supabase Auth's own confirmation email, since that's tied
// to email_confirmed_at, which signUpSeller above can no longer leave unset.
export async function sendSellerVerificationEmail(sellerId: string, email: string, origin: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const token = randomUUID();
  const { error } = await supabase.from("sellers").update({ email_verification_token: token }).eq("id", sellerId);
  if (error) throw error;

  await sendTransactionalEmail({
    to: email,
    subject: "Verify your email for GaadiGear",
    html: `<p>Click the link below to verify your email and finish setting up your GaadiGear seller account.</p><p><a href="${origin}/gaadigear/sell/verify-email?token=${token}">Verify email</a></p>`,
  });
}

// Looked up by email (not sellerId) since the only caller is the "resend"
// button on a dashboard the seller is already logged into, or is about to be.
export async function resendSellerVerificationEmail(email: string, origin: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: sellerRow, error } = await supabase.from("sellers").select("id").eq("contact_email", email.trim().toLowerCase()).maybeSingle();
  if (error) throw error;
  if (!sellerRow) return; // Don't leak whether an account exists for this email.

  await sendSellerVerificationEmail((sellerRow as DbRow).id as string, email, origin);
}

// Called from /gaadigear/sell/verify-email?token=... -- one-time use, clears
// the token once consumed so it can't be replayed.
export async function verifySellerEmailToken(token: string): Promise<Seller | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: sellerRow, error } = await supabase.from("sellers").select("*").eq("email_verification_token", token).maybeSingle();
  if (error) throw error;
  if (!sellerRow) return null;

  const { data: updated, error: updateError } = await supabase
    .from("sellers")
    .update({ email_verified_at: new Date().toISOString(), email_verification_token: null })
    .eq("id", (sellerRow as DbRow).id)
    .select("*")
    .single();
  if (updateError) throw updateError;

  return mapSeller(updated as DbRow);
}

// Completes signup for a user who authenticated via Google OAuth instead of
// email/password -- signInWithOAuth only establishes a Supabase session, it
// doesn't know anything about "sellers"/"seller_users", so this is the
// missing second half: called once, right after a first-time OAuth sign-in,
// from the /gaadigear/sell/auth/complete page. Google already vouches for the
// email, so email_verified_at is set immediately -- no separate Resend
// verification email needed for this path.
export async function createSellerForAuthenticatedUser(userId: string, businessName: string, contactEmail?: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: existing } = await supabase.from("seller_users").select("seller_id").eq("user_id", userId).maybeSingle();
  if (existing) {
    const { data: sellerRow, error } = await supabase.from("sellers").select("*").eq("id", (existing as DbRow).seller_id).single();
    if (error) throw error;
    return mapSeller(sellerRow as DbRow);
  }

  const { data: sellerRow, error: sellerError } = await supabase
    .from("sellers")
    .insert({
      business_name: businessName,
      contact_email: contactEmail || null,
      status: "onboarding",
      kyc_status: "pending_review",
      email_verified_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (sellerError) throw sellerError;

  const { error: sellerUserError } = await supabase.from("seller_users").insert({
    user_id: userId,
    seller_id: (sellerRow as DbRow).id,
    role: "seller_owner",
    active: true,
  });

  if (sellerUserError) throw sellerUserError;

  return mapSeller(sellerRow as DbRow);
}

// --- Onboarding steps ---

export async function updateSellerBusinessDetails(
  sellerId: string,
  input: {
    businessName?: string;
    brandName?: string;
    businessType?: string;
    gstin?: string;
    pan?: string;
    contactPhone?: string;
    contactEmail?: string;
    logoUrl?: string;
    bannerUrl?: string;
    about?: string;
  },
) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const patch: DbRow = {};
  if (input.businessName !== undefined) patch.business_name = input.businessName;
  if (input.brandName !== undefined) patch.brand_name = input.brandName || null;
  if (input.businessType !== undefined) patch.business_type = input.businessType || null;
  if (input.gstin !== undefined) patch.gstin = input.gstin || null;
  if (input.pan !== undefined) patch.pan = input.pan || null;
  if (input.contactPhone !== undefined) patch.contact_phone = input.contactPhone || null;
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail || null;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl || null;
  if (input.bannerUrl !== undefined) patch.banner_url = input.bannerUrl || null;
  if (input.about !== undefined) patch.about = input.about || null;

  const { data, error } = await supabase.from("sellers").update(patch).eq("id", sellerId).select("*").single();
  if (error) throw error;
  return mapSeller(data as DbRow);
}

function mapSellerKycDocument(row: DbRow): SellerKycDocument {
  return {
    id: str(row, "id"),
    sellerId: str(row, "seller_id"),
    docType: str(row, "doc_type"),
    fileUrl: str(row, "file_url"),
    uploadedAt: str(row, "uploaded_at"),
  };
}

export async function addSellerKycDocument(sellerId: string, input: { docType: string; fileUrl: string }): Promise<SellerKycDocument> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase
    .from("seller_kyc_documents")
    .insert({ seller_id: sellerId, doc_type: input.docType, file_url: input.fileUrl })
    .select("*")
    .single();

  if (error) throw error;
  return mapSellerKycDocument(data as DbRow);
}

export async function getSellerKycDocuments(sellerId: string): Promise<SellerKycDocument[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase.from("seller_kyc_documents").select("*").eq("seller_id", sellerId).order("uploaded_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbRow[]).map(mapSellerKycDocument);
}

function mapSellerBankDetails(sellerId: string, row: DbRow): SellerBankDetails {
  return {
    sellerId,
    accountHolder: optionalStr(row, "account_holder"),
    ifsc: optionalStr(row, "ifsc"),
    upiId: optionalStr(row, "upi_id"),
    payoutCycle: str(row, "payout_cycle") || "weekly",
  };
}

export async function upsertSellerBankDetails(
  sellerId: string,
  input: { accountHolder?: string; accountNumberEnc?: string; ifsc?: string; upiId?: string; payoutCycle?: string },
): Promise<SellerBankDetails> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase
    .from("seller_bank_details")
    .upsert(
      {
        seller_id: sellerId,
        account_holder: input.accountHolder || null,
        account_number_enc: input.accountNumberEnc || null,
        ifsc: input.ifsc || null,
        upi_id: input.upiId || null,
        payout_cycle: input.payoutCycle || "weekly",
      },
      { onConflict: "seller_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapSellerBankDetails(sellerId, data as DbRow);
}

export async function getSellerBankDetails(sellerId: string): Promise<SellerBankDetails | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase.from("seller_bank_details").select("*").eq("seller_id", sellerId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSellerBankDetails(sellerId, data as DbRow);
}

function mapSellerShippingSettings(sellerId: string, row: DbRow): SellerShippingSettingsRecord {
  return {
    sellerId,
    shipsPanIndia: bool(row, "ships_pan_india", true),
    excludedStates: Array.isArray(row.excluded_states) ? (row.excluded_states as string[]) : [],
    excludedPincodes: Array.isArray(row.excluded_pincodes) ? (row.excluded_pincodes as string[]) : [],
    feeType: (str(row, "fee_type") || "flat") as SellerShippingSettingsRecord["feeType"],
    flatFee: num(row, "flat_fee"),
    freeShippingAbove: row.free_shipping_above !== null && row.free_shipping_above !== undefined ? num(row, "free_shipping_above") : undefined,
    standardDeliveryDays: num(row, "standard_delivery_days", 5),
    codAvailable: bool(row, "cod_available"),
  };
}

export async function getSellerShippingSettings(sellerId: string): Promise<SellerShippingSettingsRecord | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase.from("seller_shipping_settings").select("*").eq("seller_id", sellerId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSellerShippingSettings(sellerId, data as DbRow);
}

export async function upsertSellerShippingSettings(
  sellerId: string,
  input: {
    shipsPanIndia?: boolean;
    excludedStates?: string[];
    excludedPincodes?: string[];
    feeType?: "flat" | "free" | "threshold";
    flatFee?: number;
    freeShippingAbove?: number;
    standardDeliveryDays?: number;
    codAvailable?: boolean;
  },
): Promise<SellerShippingSettingsRecord> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data, error } = await supabase
    .from("seller_shipping_settings")
    .upsert(
      {
        seller_id: sellerId,
        ships_pan_india: input.shipsPanIndia ?? true,
        excluded_states: input.excludedStates ?? [],
        excluded_pincodes: input.excludedPincodes ?? [],
        fee_type: input.feeType ?? "flat",
        flat_fee: input.flatFee ?? 0,
        free_shipping_above: input.freeShippingAbove ?? null,
        standard_delivery_days: input.standardDeliveryDays ?? 5,
        cod_available: input.codAvailable ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seller_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapSellerShippingSettings(sellerId, data as DbRow);
}
