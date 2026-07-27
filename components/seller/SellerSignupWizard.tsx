"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormField } from "@/components/seller/FormField";
import { storePendingBusinessName } from "@/components/seller/SellerOAuthCompleteHandler";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { GearCategory } from "@/types/automobile";

const fieldClass =
  "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

async function sendJson(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

async function getJson(url: string) {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

// "email" covers both the initial business-name+email form AND, once
// submitted, the "check your email" holding screen (with change-email) --
// they're the same conceptual step, not separate ones. Bank details are
// deliberately not a step here anymore -- that's collected later from
// /seller/settings instead.
const STEP_ORDER = ["email", "password", "business", "categories", "kyc", "done"] as const;
type Step = (typeof STEP_ORDER)[number];

export function SellerSignupWizard({ l1Categories }: { l1Categories: GearCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingPending, setLoadingPending] = useState(Boolean(searchParams.get("pending")));

  // Step "email"
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [pendingId, setPendingId] = useState<string | undefined>(searchParams.get("pending") ?? undefined);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  // Step "password"
  const [password, setPassword] = useState("");

  // Step "business"
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("individual");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Step "categories" (non-binding, routes review priority only -- not persisted)
  const [interestedCategoryIds, setInterestedCategoryIds] = useState<string[]>([]);

  // Step "kyc"
  const [kycDocs, setKycDocs] = useState<{ docType: string; fileUrl: string }[]>([]);
  const [docType, setDocType] = useState("gst_certificate");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const panError = pan && !PAN_PATTERN.test(pan) ? "PAN should look like ABCDE1234F." : "";
  const gstinError = gstin && !GSTIN_PATTERN.test(gstin) ? "GSTIN should look like 22AAAAA0000A1Z5." : "";
  const businessValid = Boolean(pan) && !panError && !gstinError;

  // Resume from the verification link: ?pending=<id> means this tab is the
  // one the email link opened. Fetch the pending request to learn business
  // name/email and whether it's actually verified yet.
  useEffect(() => {
    if (!pendingId) return;
    let cancelled = false;

    async function loadPending() {
      try {
        const data = await getJson(`/api/seller/auth/signup/start?pendingId=${pendingId}`);
        if (cancelled) return;
        setBusinessName(data.businessName);
        setEmail(data.email);
        if (data.verifiedAt) {
          setStep("password");
        } else {
          setAwaitingVerification(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load signup request");
      } finally {
        if (!cancelled) setLoadingPending(false);
      }
    }

    loadPending();
    return () => {
      cancelled = true;
    };
  }, [pendingId]);

  async function submitEmailStep() {
    setSaving(true);
    setError("");
    try {
      const result = await sendJson("/api/seller/auth/signup/start", "POST", { businessName, email });
      setPendingId(result.id);
      setAwaitingVerification(true);
      router.replace(`/gaadigear/sell/signup?pending=${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start signup");
    } finally {
      setSaving(false);
    }
  }

  async function submitChangeEmail() {
    if (!pendingId) return;
    setSaving(true);
    setError("");
    try {
      await sendJson("/api/seller/auth/signup/start", "PATCH", { pendingId, email: newEmail });
      setEmail(newEmail);
      setChangingEmail(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change email");
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordStep() {
    if (!pendingId) return;
    setSaving(true);
    setError("");
    try {
      await sendJson("/api/seller/auth/signup", "POST", { pendingId, password });

      const supabase = createBrowserSupabaseClient();
      if (!supabase) throw new Error("Supabase env is not configured.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);

      setStep("business");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create account");
    } finally {
      setSaving(false);
    }
  }

  async function submitBusinessStep() {
    if (!businessValid) {
      setError("Enter a valid PAN (required), and a valid GSTIN if you have one.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await sendJson("/api/seller/onboarding", "PATCH", {
        step: "business_details",
        brandName,
        businessType,
        gstin,
        pan,
        contactPhone,
      });
      setStep("categories");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save business details");
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(id: string) {
    setInterestedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function continueFromCategoriesStep() {
    setError("");
    try {
      // Non-binding (doesn't gate anything), but still persisted for admin
      // review prioritization -- fire-and-forget-ish, don't block on it.
      await sendJson("/api/seller/onboarding", "PATCH", { step: "categories", categoryIds: interestedCategoryIds });
    } catch {
      // Non-critical -- proceed regardless.
    }
    setStep("kyc");
  }

  async function uploadKycDoc(file: File) {
    setUploadingDoc(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/seller/upload-document", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);

      await sendJson("/api/seller/onboarding", "PATCH", { step: "kyc_document", docType, fileUrl: payload.url });
      setKycDocs([...kycDocs, { docType, fileUrl: payload.url }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload document");
    } finally {
      setUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  }

  function finishFromKycStep() {
    if (kycDocs.length === 0) {
      setError("Add at least one KYC document before continuing -- admin needs this to review your application.");
      return;
    }
    setError("");
    setStep("done");
  }

  // Requires the Google provider to be enabled in the Supabase dashboard
  // (Authentication > Providers > Google) -- not configurable from here.
  // Unaffected by the email-verification flow above: Google already vouches
  // for the email, so there's nothing to separately verify.
  async function handleGoogleSignup() {
    setError("");
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase env is not configured.");
      setSaving(false);
      return;
    }
    storePendingBusinessName(businessName);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/gaadigear/sell/auth/complete` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSaving(false);
    }
  }

  function goBack() {
    setError("");
    const index = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.max(0, index - 1)]);
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  if (loadingPending) {
    return <p className="text-sm font-bold text-slate-500">Loading…</p>;
  }

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Step {stepIndex + 1} of {STEP_ORDER.length}</p>
      <div className="mb-6 mt-2 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <span className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-emerald-500" : "bg-slate-200"}`} key={s} />
        ))}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

      {step === "email" && !awaitingVerification && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Create your seller account</h1>
          <FormField label="Business name (required)">
            <input className={fieldClass} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Revx Riding Gear" value={businessName} />
          </FormField>
          <FormField label="Email (required)">
            <input className={fieldClass} onChange={(e) => setEmail(e.target.value)} placeholder="rahul@revxgear.com" type="email" value={email} />
          </FormField>
          <button
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
            disabled={saving || !email || !businessName}
            onClick={submitEmailStep}
            type="button"
          >
            {saving ? "Sending…" : "Verify email to continue"}
          </button>

          <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <button
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={saving || !businessName}
            onClick={handleGoogleSignup}
            type="button"
          >
            Continue with Google
          </button>
          <p className="text-xs text-slate-400">
            Enter your business name above first — Google sign-in still needs it to create your seller profile.
          </p>
        </div>
      )}

      {step === "email" && awaitingVerification && (
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-black text-slate-950">Check your email</h1>
          <p className="text-sm leading-6 text-slate-600">
            We sent a verification link to <span className="font-bold text-slate-950">{email}</span>. Click it to continue
            creating your account.
          </p>
          {changingEmail ? (
            <div className="space-y-2 text-left">
              <FormField label="New email">
                <input className={fieldClass} onChange={(e) => setNewEmail(e.target.value)} type="email" value={newEmail} />
              </FormField>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50"
                  disabled={saving || !newEmail}
                  onClick={submitChangeEmail}
                  type="button"
                >
                  {saving ? "Updating…" : "Update & resend"}
                </button>
                <button className="text-sm font-bold text-slate-500 hover:underline" onClick={() => setChangingEmail(false)} type="button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-sm font-bold text-emerald-700 hover:underline"
              onClick={() => {
                setChangingEmail(true);
                setNewEmail(email);
              }}
              type="button"
            >
              Wrong email? Change it
            </button>
          )}
        </div>
      )}

      {step === "password" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Set your password</h1>
          <p className="text-sm text-slate-500">
            {businessName} — <span className="font-bold text-slate-700">{email}</span>
          </p>
          <FormField label="Password (required)">
            <input
              className={fieldClass}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              type="password"
              value={password}
            />
          </FormField>
          <button
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
            disabled={saving || password.length < 8}
            onClick={submitPasswordStep}
            type="button"
          >
            {saving ? "Creating account…" : "Create account"}
          </button>
        </div>
      )}

      {step === "business" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Business details</h1>
          <FormField label="Storefront / brand name (optional)">
            <input className={fieldClass} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. RevX" value={brandName} />
          </FormField>
          <FormField label="Business type">
            <select className={fieldClass} onChange={(e) => setBusinessType(e.target.value)} value={businessType}>
              <option value="individual">Individual</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="pvt_ltd">Private Limited</option>
            </select>
          </FormField>
          <FormField label="GSTIN (optional)">
            <input className={fieldClass} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="e.g. 22AAAAA0000A1Z5" value={gstin} />
            {gstinError && <p className="mt-1 text-xs font-bold text-red-600">{gstinError}</p>}
          </FormField>
          <FormField label="PAN (required)">
            <input className={fieldClass} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" value={pan} />
            {panError && <p className="mt-1 text-xs font-bold text-red-600">{panError}</p>}
          </FormField>
          <FormField label="Contact phone">
            <input className={fieldClass} onChange={(e) => setContactPhone(e.target.value)} placeholder="98765 43210" value={contactPhone} />
          </FormField>
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
              disabled={saving || !businessValid}
              onClick={submitBusinessStep}
              type="button"
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === "categories" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">What will you sell?</h1>
          <p className="text-sm text-slate-500">This just helps us prioritize your review — you can list in any category later.</p>
          <div className="flex flex-wrap gap-2">
            {l1Categories.map((c) => (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  interestedCategoryIds.includes(c.id) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"
                }`}
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                type="button"
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="text-sm font-bold text-slate-500 hover:underline" onClick={goBack} type="button">
              Back
            </button>
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400"
              onClick={continueFromCategoriesStep}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "kyc" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">KYC documents</h1>
          <p className="text-sm text-slate-500">At least one document is required before your application can be reviewed.</p>
          <div className="flex items-end gap-2">
            <FormField label="Document type">
              <select className={fieldClass} onChange={(e) => setDocType(e.target.value)} value={docType}>
                <option value="gst_certificate">GST certificate</option>
                <option value="pan_card">PAN card</option>
                <option value="cancelled_cheque">Cancelled cheque</option>
                <option value="address_proof">Address proof</option>
              </select>
            </FormField>
            <button
              className="mb-2 shrink-0 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              disabled={uploadingDoc}
              onClick={() => docFileInputRef.current?.click()}
              type="button"
            >
              {uploadingDoc ? "Uploading…" : "+ Upload document"}
            </button>
            <input
              accept="image/*,application/pdf"
              className="hidden"
              disabled={uploadingDoc}
              onChange={(e) => e.target.files?.[0] && uploadKycDoc(e.target.files[0])}
              ref={docFileInputRef}
              type="file"
            />
          </div>
          <ul className="space-y-1 text-sm text-slate-600">
            {kycDocs.map((d, i) => (
              <li key={i}>
                {d.docType.replace("_", " ")}:{" "}
                <a className="font-bold text-emerald-700 hover:underline" href={d.fileUrl} rel="noreferrer" target="_blank">
                  View uploaded file
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button className="text-sm font-bold text-slate-500 hover:underline" onClick={goBack} type="button">
              Back
            </button>
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
              disabled={kycDocs.length === 0}
              onClick={finishFromKycStep}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-black text-slate-950">Application submitted</h1>
          <p className="text-sm leading-6 text-slate-600">
            We&apos;re reviewing your application — typically approved within 1-2 business days. We&apos;ll email you once
            you&apos;re live.
          </p>
          <button
            className="w-full rounded-lg bg-slate-950 px-4 py-3 text-base font-black text-white transition hover:bg-slate-800"
            onClick={() => router.push("/seller")}
            type="button"
          >
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
