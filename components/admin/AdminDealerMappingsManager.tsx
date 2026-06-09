"use client";

import { DealerAdminSubnav, dealerStatusPill } from "@/components/admin/dealer-admin-shared";
import type { Brand, City, Dealer, DealerBrandMapping } from "@/types/automobile";

type Props = {
  brands: Brand[];
  cities: City[];
  dealers: Dealer[];
  mappings: DealerBrandMapping[];
};

export function AdminDealerMappingsManager({ brands, cities, dealers, mappings }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">Dealer operations</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Dealer mappings</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              These mappings control which showroom is eligible for a brand and city combination in public pricing and lead routing.
            </p>
          </div>
          <DealerAdminSubnav />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Brand-city-showroom mappings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mappings.length ? mappings.map((mapping) => {
            const dealer = dealers.find((item) => item.id === mapping.dealerId);
            const brand = brands.find((item) => item.id === mapping.brandId);
            const city = cities.find((item) => item.id === mapping.cityId);

            return (
              <div className="rounded-lg border border-slate-200 p-3" key={mapping.id}>
                <div className="text-xs font-black uppercase text-emerald-700">{city?.name ?? "Unknown city"}</div>
                <div className="mt-1 font-black text-slate-950">{brand?.name ?? "Unknown brand"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{dealer?.name ?? "Unknown showroom"}</div>
                <div className="mt-2">{dealerStatusPill(mapping.active)}</div>
              </div>
            );
          }) : (
            <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-500">No mappings created yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
