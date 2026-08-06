import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";
import { getVerifiedDealersByBrand } from "@/lib/services/dealer-directory";

export const metadata: Metadata = {
  title: "Find a verified dealer | Gaadieasy",
  description: "Browse verified dealers by brand, with direct contact numbers.",
};

export default async function DealersDirectoryPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  const [catalog, dealers] = await Promise.all([getSlimCatalog(), getVerifiedDealersByBrand(brand)]);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Dealer directory</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950">Find a verified dealer</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Every dealer here has been reviewed and approved before appearing — filter by brand and reach out directly.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
              !brand ? "border-lime-400 bg-lime-300 text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-lime-300"
            }`}
            href="/dealers"
          >
            All brands
          </Link>
          {catalog.brands.map((b) => (
            <Link
              className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                brand === b.slug ? "border-lime-400 bg-lime-300 text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-lime-300"
              }`}
              href={`/dealers?brand=${b.slug}`}
              key={b.id}
            >
              {b.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {dealers.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No verified dealers {brand ? "for this brand" : ""} yet.
            </div>
          )}
          {dealers.map((dealer) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              key={dealer.dealerId}
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-50 text-lg font-black text-emerald-700">
                  {dealer.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-950">{dealer.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-black text-lime-900">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-500">
                    <MapPin size={12} />
                    {[dealer.area, dealer.cityName].filter(Boolean).join(", ") || "Location not listed"}
                    {dealer.brandName ? ` · ${dealer.brandName}` : ""}
                  </p>
                </div>
              </div>
              {dealer.phone ? (
                <a
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                  href={`tel:${dealer.phone}`}
                >
                  <Phone size={14} /> {dealer.phone}
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-400">No phone listed</span>
              )}
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
