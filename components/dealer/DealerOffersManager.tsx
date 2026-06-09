"use client";

import { useState } from "react";
import type { Brand, City, Dealer, Offer, VehicleModel } from "@/types/automobile";
import { formatIndianPrice } from "@/lib/utils/format";

type Props = {
  offers: Offer[];
  showrooms: Dealer[];
  brands: Brand[];
  models: VehicleModel[];
  cities: City[];
  canSelectShowroom: boolean;
};

export function DealerOffersManager({ offers, showrooms, brands, models, cities, canSelectShowroom }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountAmount: "",
    dealerId: "",
    brandId: "",
    modelId: "",
    cityId: "",
    startDate: "",
    endDate: "",
  });

  const selectedBrandModels = form.brandId ? models.filter((model) => model.brandId === form.brandId) : models;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const response = await fetch("/api/dealer/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.error ?? "Unable to create offer");
      return;
    }

    setMessage("Offer submitted for admin approval.");
    setForm({
      title: "",
      description: "",
      discountAmount: "",
      dealerId: "",
      brandId: "",
      modelId: "",
      cityId: "",
      startDate: "",
      endDate: "",
    });
    window.location.reload();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Dealer offer</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Create city offer</h2>
        <p className="mt-1 text-sm text-slate-500">Submitted offers stay pending until platform admin approves them.</p>

        <label className="mt-4 block text-xs font-black uppercase text-slate-500">Offer title</label>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
          required
        />

        <label className="mt-3 block text-xs font-black uppercase text-slate-500">Description</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="mt-1 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 font-bold outline-none focus:border-emerald-400"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">Discount amount</label>
            <input
              type="number"
              min="0"
              value={form.discountAmount}
              onChange={(event) => setForm((current) => ({ ...current, discountAmount: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">City</label>
            <select
              value={form.cityId}
              onChange={(event) => setForm((current) => ({ ...current, cityId: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option value={city.id} key={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
        </div>

        {canSelectShowroom ? (
          <div className="mt-3">
            <label className="block text-xs font-black uppercase text-slate-500">Showroom</label>
            <select
              value={form.dealerId}
              onChange={(event) => setForm((current) => ({ ...current, dealerId: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            >
              <option value="">All showrooms</option>
              {showrooms.map((dealer) => (
                <option value={dealer.id} key={dealer.id}>{dealer.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">Brand</label>
            <select
              value={form.brandId}
              onChange={(event) => setForm((current) => ({ ...current, brandId: event.target.value, modelId: "" }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            >
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option value={brand.id} key={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">Model</label>
            <select
              value={form.modelId}
              onChange={(event) => setForm((current) => ({ ...current, modelId: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            >
              <option value="">All models</option>
              {selectedBrandModels.map((model) => (
                <option value={model.id} key={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-500">End date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-black text-slate-950 hover:bg-lime-400 disabled:bg-slate-300"
        >
          {loading ? "Submitting..." : "Submit offer"}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Offer queue</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Dealer offers</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {offers.length ? offers.map((offer) => (
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]" key={offer.id}>
              <div>
                <div className="font-black text-slate-950">{offer.title}</div>
                {offer.description ? <div className="mt-1 text-sm text-slate-500">{offer.description}</div> : null}
                <div className="mt-2 text-xs font-bold uppercase text-slate-400">{offer.approvalStatus ?? "approved"}</div>
              </div>
              <div className="text-sm font-black text-emerald-800">{formatIndianPrice(offer.discountAmount)}</div>
            </div>
          )) : (
            <div className="p-4 text-sm font-bold text-slate-500">No dealer offers yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
