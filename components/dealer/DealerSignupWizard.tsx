"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { describeApiError } from "@/lib/utils/api-error";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Brand, City } from "@/types/automobile";

const fieldClass =
  "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

async function sendJson(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(describeApiError(payload, `HTTP ${response.status}`));
  return payload;
}

async function getJson(url: string) {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) throw new Error(describeApiError(payload, `HTTP ${response.status}`));
  return payload;
}

// "email" covers both the initial business-name+email form AND, once
// submitted, the "check your email" holding screen -- same conceptual step,
// not a separate one. Mirrors SellerSignupWizard.tsx's shape, minus the
// KYC-docs step (dealers aren't asked for documents -- admin just reviews
// the typed details) and with a brand multi-select instead of a
// category-interest step.
const STEP_ORDER = ["email", "password", "business", "brands", "done"] as const;
type Step = (typeof STEP_ORDER)[number];

export function DealerSignupWizard({ brands, cities }: { brands: Brand[]; cities: City[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingPending, setLoadingPending] = useState(Boolean(searchParams.get("pending")));

  // Step "email"
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingId, setPendingId] = useState<string | undefined>(searchParams.get("pending") ?? undefined);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  // Step "password"
  const [password, setPassword] = useState("");

  // Step "business"
  const [cityId, setCityId] = useState("");
  const [area, setArea] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Step "brands"
  const [brandIds, setBrandIds] = useState<string[]>([]);

  useEffect(() => {
    if (!pendingId) return;
    let cancelled = false;

    async function loadPending() {
      try {
        const data = await getJson(`/api/dealer/auth/signup/start?pendingId=${pendingId}`);
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
      const result = await sendJson("/api/dealer/auth/signup/start", "POST", { businessName, email, phone: phone || undefined });
      setPendingId(result.id);
      setAwaitingVerification(true);
      router.replace(`/dealer/signup?pending=${result.id}`);
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
      await sendJson("/api/dealer/auth/signup/start", "PATCH", { pendingId, email: newEmail });
      setEmail(newEmail);
      setChangingEmail(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change email");
    } finally {
      setSaving(false);
    }
  }

  async function submitPasswordStep() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStep("business");
  }

  function toggleBrand(id: string) {
    setBrandIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  async function submitSignup() {
    if (!pendingId) return;
    if (!cityId) {
      setError("Select a city for your showroom.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await sendJson("/api/dealer/auth/signup", "POST", {
        pendingId,
        password,
        cityId,
        area: area || undefined,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        gstNumber: gstNumber || undefined,
        brandIds,
      });

      const supabase = createBrowserSupabaseClient();
      if (!supabase) throw new Error("Supabase env is not configured.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);

      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create dealer account");
    } finally {
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
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Step {stepIndex + 1} of {STEP_ORDER.length}</p>
      <div className="mb-6 mt-2 flex items-center gap-2">
        {STEP_ORDER.map((s, i) => (
          <span className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-emerald-500" : "bg-slate-200"}`} key={s} />
        ))}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

      {step === "email" && !awaitingVerification && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Register your dealer business</h1>
          <label className="block text-sm font-bold text-slate-700">
            Business name
            <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
            <input className={`${fieldClass} mt-1`} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Metro Motors" value={businessName} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Email
            <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
            <input className={`${fieldClass} mt-1`} onChange={(e) => setEmail(e.target.value)} placeholder="you@metromotors.com" type="email" value={email} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Phone
            <input className={`${fieldClass} mt-1`} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" value={phone} />
          </label>
          <button
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
            disabled={saving || !email || !businessName}
            onClick={submitEmailStep}
            type="button"
          >
            {saving ? "Sending…" : "Verify email to continue"}
          </button>
        </div>
      )}

      {step === "email" && awaitingVerification && (
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-black text-slate-950">Check your email</h1>
          <p className="text-sm leading-6 text-slate-600">
            We sent a verification link to <span className="font-bold text-slate-950">{email}</span>. Click it to continue
            creating your dealer account.
          </p>
          {changingEmail ? (
            <div className="space-y-2 text-left">
              <label className="block text-sm font-bold text-slate-700">
                New email
                <input className={`${fieldClass} mt-1`} onChange={(e) => setNewEmail(e.target.value)} type="email" value={newEmail} />
              </label>
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
          <label className="block text-sm font-bold text-slate-700">
            Password
            <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
            <input className={`${fieldClass} mt-1`} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" type="password" value={password} />
          </label>
          <button
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
            disabled={password.length < 8}
            onClick={submitPasswordStep}
            type="button"
          >
            Continue
          </button>
        </div>
      )}

      {step === "business" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Your showroom</h1>
          <label className="block text-sm font-bold text-slate-700">
            City
            <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>
            <select className={`${fieldClass} mt-1`} onChange={(e) => setCityId(e.target.value)} value={cityId}>
              <option value="">Select city…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Area / locality
            <input className={`${fieldClass} mt-1`} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Whitefield" value={area} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Contact person
            <input className={`${fieldClass} mt-1`} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g. Rahul Sharma" value={contactPerson} />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            GSTIN
            <input className={`${fieldClass} mt-1`} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} placeholder="e.g. 22AAAAA0000A1Z5" value={gstNumber} />
          </label>
          <div className="flex gap-3">
            <button className="text-sm font-bold text-slate-500 hover:underline" onClick={goBack} type="button">
              Back
            </button>
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
              disabled={!cityId}
              onClick={() => setStep("brands")}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "brands" && (
        <div className="space-y-3">
          <h1 className="text-2xl font-black text-slate-950">Which brands do you sell?</h1>
          <p className="text-sm text-slate-500">
            Admin can add or adjust these anytime after your account is verified — just pick what applies for now.
          </p>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  brandIds.includes(b.id) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600"
                }`}
                key={b.id}
                onClick={() => toggleBrand(b.id)}
                type="button"
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="text-sm font-bold text-slate-500 hover:underline" onClick={goBack} type="button">
              Back
            </button>
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-base font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-50"
              disabled={saving}
              onClick={submitSignup}
              type="button"
            >
              {saving ? "Creating account…" : "Create dealer account"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-black text-slate-950">Account created</h1>
          <p className="text-sm leading-6 text-slate-600">
            We&apos;re reviewing your business — typically approved within 1-2 business days. You can still manage your
            showroom details in the meantime.
          </p>
          <button
            className="w-full rounded-lg bg-slate-950 px-4 py-3 text-base font-black text-white transition hover:bg-slate-800"
            onClick={() => router.push("/dealer")}
            type="button"
          >
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
