"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PENDING_BUSINESS_NAME_KEY = "gaadigear_pending_business_name";

async function getJson(url: string) {
  const response = await fetch(url);
  return { ok: response.ok, payload: await response.json() };
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

export function SellerOAuthCompleteHandler() {
  const router = useRouter();
  const [needsBusinessName, setNeedsBusinessName] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Finishing sign-in…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const me = await getJson("/api/seller/me");
      if (cancelled) return;

      if (me.ok) {
        router.push("/seller");
        return;
      }

      const pendingName = sessionStorage.getItem(PENDING_BUSINESS_NAME_KEY);
      if (pendingName) {
        try {
          await postJson("/api/seller/auth/complete-oauth-signup", { businessName: pendingName });
          sessionStorage.removeItem(PENDING_BUSINESS_NAME_KEY);
          if (!cancelled) router.push("/seller");
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Unable to finish creating your seller account");
            setNeedsBusinessName(true);
            setStatus("");
          }
        }
        return;
      }

      // Arrived here without a business name in sessionStorage -- e.g. signed
      // in via Google from the login page rather than the signup wizard.
      setNeedsBusinessName(true);
      setStatus("");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submitBusinessName() {
    setError("");
    try {
      await postJson("/api/seller/auth/complete-oauth-signup", { businessName });
      router.push("/seller");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to finish creating your seller account");
    }
  }

  if (needsBusinessName) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-black text-slate-950">One more thing</h1>
        <p className="mt-2 text-sm text-slate-500">What&apos;s your business name?</p>
        <input
          className="mt-3 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-950 outline-none"
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          value={businessName}
        />
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
        <button
          className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
          disabled={businessName.length < 2}
          onClick={submitBusinessName}
          type="button"
        >
          Continue
        </button>
      </div>
    );
  }

  return <p className="text-sm text-slate-500">{status}</p>;
}

export function storePendingBusinessName(name: string) {
  sessionStorage.setItem(PENDING_BUSINESS_NAME_KEY, name);
}
