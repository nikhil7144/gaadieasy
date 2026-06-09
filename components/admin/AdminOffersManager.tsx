"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { patchAdminJson } from "@/components/admin/admin-form-utils";
import { formatIndianPrice } from "@/lib/utils/format";
import type { Brand, City, Dealer, DealerBusiness, Offer, VehicleModel } from "@/types/automobile";

type Props = {
  offers: Offer[];
  brands: Brand[];
  models: VehicleModel[];
  cities: City[];
  dealers: Dealer[];
  dealerBusinesses: DealerBusiness[];
};

type OfferStatusFilter = "all" | "pending" | "approved" | "rejected";

function statusPill(status: Offer["approvalStatus"] = "approved") {
  const styles =
    status === "approved"
      ? "bg-emerald-50 text-emerald-800"
      : status === "rejected"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${styles}`}>
      {status}
    </span>
  );
}

export function AdminOffersManager({ offers, brands, models, cities, dealers, dealerBusinesses }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("pending");

  const filteredOffers = useMemo(() => {
    const sorted = [...offers].sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1, rejected: 2 } as const;
      const aRank = statusOrder[(a.approvalStatus ?? "approved") as keyof typeof statusOrder] ?? 9;
      const bRank = statusOrder[(b.approvalStatus ?? "approved") as keyof typeof statusOrder] ?? 9;
      if (aRank !== bRank) return aRank - bRank;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

    if (statusFilter === "all") return sorted;
    return sorted.filter((offer) => (offer.approvalStatus ?? "approved") === statusFilter);
  }, [offers, statusFilter]);

  async function updateOffer(id: string, patch: { approvalStatus?: "pending" | "approved" | "rejected"; active?: boolean }) {
    setSavingId(id);
    setMessage("");
    setError("");

    try {
      await patchAdminJson("/api/admin/offers", { id, ...patch });
      setMessage("Offer updated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update offer");
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Offer approval desk</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Offers</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review dealer and platform offers. Only approved active offers appear publicly in pricing and dealer cards.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((item) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-black ${
                statusFilter === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
              }`}
              key={item}
              onClick={() => setStatusFilter(item)}
              type="button"
            >
              {item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
      </div>

      <div className="grid gap-4">
        {filteredOffers.length ? filteredOffers.map((offer) => {
          const brand = brands.find((item) => item.id === offer.brandId);
          const model = models.find((item) => item.id === offer.modelId);
          const city = cities.find((item) => item.id === offer.cityId);
          const showroom = dealers.find((item) => item.id === offer.dealerId);
          const business = dealerBusinesses.find((item) => item.id === offer.dealerBusinessId);
          const isSaving = savingId === offer.id;

          return (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={offer.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusPill(offer.approvalStatus)}
                    <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${offer.active ? "bg-lime-100 text-lime-900" : "bg-slate-100 text-slate-600"}`}>
                      {offer.active ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-600">
                      {offer.placement}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{offer.title}</h2>
                  {offer.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{offer.description}</p> : null}
                </div>
                <div className="text-right">
                  <div className="text-xs font-black uppercase text-emerald-700">Discount</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{formatIndianPrice(offer.discountAmount)}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-400">Dealer business</div>
                  <div className="mt-1 font-bold text-slate-900">{business?.name ?? "Not linked"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-400">Showroom</div>
                  <div className="mt-1 font-bold text-slate-900">{showroom?.name ?? "All showrooms"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-400">Brand / model</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {[brand?.name, model?.name].filter(Boolean).join(" / ") || "All vehicles"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-400">City / dates</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {city?.name ?? "All cities"}
                    {(offer.startDate || offer.endDate) ? ` / ${offer.startDate ?? "Now"} to ${offer.endDate ?? "Open"}` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:bg-slate-200"
                  disabled={isSaving}
                  onClick={() => updateOffer(offer.id, { approvalStatus: "approved", active: true })}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="rounded-md bg-amber-100 px-4 py-2 text-sm font-black text-amber-900 hover:bg-amber-200 disabled:bg-slate-200"
                  disabled={isSaving}
                  onClick={() => updateOffer(offer.id, { approvalStatus: "rejected", active: false })}
                  type="button"
                >
                  Reject
                </button>
                <button
                  className="rounded-md bg-slate-100 px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-200 disabled:bg-slate-200"
                  disabled={isSaving}
                  onClick={() => updateOffer(offer.id, { active: !offer.active })}
                  type="button"
                >
                  {offer.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm font-bold text-slate-500">
            No offers found in this tab.
          </div>
        )}
      </div>
    </section>
  );
}
