"use client";

import { useState } from "react";
import type { PricingResult } from "@/types/automobile";

type LeadFormProps = {
  pricing: PricingResult;
  source?: "pricing_page" | "seo_page" | "homepage";
};

export function LeadForm({ pricing, source = "pricing_page" }: LeadFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function onSubmit(formData: FormData) {
    setStatus("loading");
    const response = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        preferredContactTime: formData.get("preferredContactTime"),
        message: formData.get("message"),
        cityId: pricing.city.id,
        brandId: pricing.brand.id,
        modelId: pricing.model.id,
        variantId: pricing.variant.id,
        selectedOnRoadPrice: pricing.breakdown.totalOnRoadPrice,
        source,
      }),
    });

    setStatus(response.ok ? "success" : "error");
  }

  return (
    <form id="lead" action={onSubmit} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Dealer enquiry</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Get a verified dealer callback</h3>
        {pricing.dealer ? (
          <p className="mt-1 text-sm text-slate-600">Matched with {pricing.dealer.name} in {pricing.city.name}.</p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">No dealer mapped yet. Admin will handle this lead.</p>
        )}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Name
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-400" name="name" placeholder="Enter your name" required />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Phone
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-400" name="phone" placeholder="Enter mobile number" required />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Email optional
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-400" name="email" placeholder="name@example.com" />
        </label>
        <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950" name="preferredContactTime">
          <option>Anytime</option>
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
        </select>
        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Message optional
          <textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 placeholder:text-slate-400" name="message" placeholder="Preferred variant, exchange, finance or test drive note" />
        </label>
      </div>
      <button
        className="mt-4 w-full rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Send enquiry"}
      </button>
      {status === "success" ? <p className="mt-3 text-sm font-semibold text-emerald-700">Thanks. We will connect you shortly.</p> : null}
      {status === "error" ? <p className="mt-3 text-sm font-semibold text-red-600">Please check the form and try again.</p> : null}
    </form>
  );
}
