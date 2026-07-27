import Link from "next/link";
import type { Metadata } from "next";
import { PackageCheck, RefreshCw, ShieldCheck, Tag, Truck } from "lucide-react";
import { GearDealsCarousel } from "@/components/public/GearDealsCarousel";
import { GearFilterSidebar } from "@/components/public/GearFilterSidebar";
import { GearHomepageSections } from "@/components/public/GearHomepageSections";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { GearVehiclePicker } from "@/components/public/GearVehiclePicker";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";
import {
  getGearFilterFacets,
  getGearProductsPLP,
  getPublicFeaturedBrands,
  getPublicGearCategories,
  getPublicHeroBanner,
  getPublicHomepageSections,
  getPublicVehicleTypes,
} from "@/lib/services/gear-public";

const trustStrip = [
  { icon: ShieldCheck, label: "100% genuine products" },
  { icon: RefreshCw, label: "Easy 3-day returns" },
  { icon: PackageCheck, label: "Verified sellers" },
  { icon: Truck, label: "PAN-India delivery" },
];

export const metadata: Metadata = {
  title: "GaadiGear — Accessories, parts & riding gear",
  description: "Shop accessories, parts and riding gear scoped to your exact vehicle, sold by verified sellers on Gaadieasy.",
};

export default async function GaadiGearHubPage() {
  const [vehicleTypes, categories, catalog, newArrivals, facets, cart, homepageSections, featuredBrands, heroBanner] = await Promise.all([
    getPublicVehicleTypes(),
    getPublicGearCategories(),
    getSlimCatalog(),
    getGearProductsPLP({ limit: 8 }),
    getGearFilterFacets({}),
    getCart(),
    getPublicHomepageSections(),
    getPublicFeaturedBrands(),
    getPublicHeroBanner(),
  ]);
  const l1Categories = categories.filter((c) => c.level === 1);
  const models = catalog.models.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />
      <main>
        <div className="mx-auto max-w-6xl gap-6 px-4 pt-6 sm:px-6 lg:flex">
          <GearFilterSidebar
            brandCounts={facets.brandCounts}
            brands={facets.brands}
            categories={categories}
            categoryCounts={facets.categoryCounts}
            priceBucketCounts={facets.priceBucketCounts}
          />

          <div className="mt-6 flex flex-1 flex-col gap-4 lg:mt-0">
            {heroBanner ? (
              <section className="flex h-56 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-lime-100 via-emerald-50 to-white sm:h-64 lg:h-72">
                {heroBanner.imageUrl && (
                  <div className="h-full w-2/5 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={heroBanner.title} className="h-full w-full object-cover" src={heroBanner.imageUrl} />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-center px-5 py-5 sm:px-8">
                  <p className="inline-flex w-fit rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
                    Premium accessories
                  </p>
                  <h1 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{heroBanner.title}</h1>
                  {heroBanner.subtitle && (
                    <p className="mt-1.5 line-clamp-2 max-w-sm text-xs font-bold text-slate-600 sm:text-sm">{heroBanner.subtitle}</p>
                  )}
                  <Link
                    className="mt-4 inline-block w-fit rounded-lg bg-slate-950 px-5 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 sm:text-sm"
                    href={heroBanner.ctaHref}
                  >
                    {heroBanner.ctaLabel}
                  </Link>
                </div>
              </section>
            ) : (
              <section className="relative flex h-56 shrink-0 flex-col justify-center overflow-hidden rounded-xl bg-slate-950 px-6 text-center text-white sm:h-64 sm:px-8 lg:h-72">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
                <div className="relative">
                  <p className="mx-auto inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
                    Premium accessories
                  </p>
                  <h1 className="mx-auto mt-3 max-w-2xl text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">
                    Upgrade your ride. Every mile, every time.
                  </h1>
                  <p className="mx-auto mt-2 hidden max-w-xl text-sm text-emerald-50 sm:block">
                    Accessories, parts and riding gear scoped to the exact vehicle you own.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      className="rounded-lg bg-lime-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-lime-200 sm:text-sm"
                      href="#shop-by-category"
                    >
                      Shop by category
                    </Link>
                    <Link
                      className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-black transition hover:border-lime-300 hover:bg-white/20 sm:text-sm"
                      href="#find-your-vehicle"
                    >
                      Search by vehicle
                    </Link>
                  </div>
                  <div className="mt-3 hidden flex-wrap items-center justify-center gap-1.5 lg:flex">
                    {vehicleTypes.map((vt) => (
                      <Link
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold transition hover:border-lime-300 hover:bg-lime-300 hover:text-slate-950"
                        href={`/gaadigear/products?vehicle_type=${vt.slug}`}
                        key={vt.id}
                      >
                        {vt.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {newArrivals.products.length > 0 && (
              <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Trending now</p>
                  <Link className="text-xs font-bold text-emerald-700 hover:underline" href="/gaadigear/products">
                    View all →
                  </Link>
                </div>
                <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-3 sm:grid-cols-4">
                  {newArrivals.products.slice(0, 4).map((p) => (
                    <Link
                      className="group rounded-lg border border-slate-200 p-2.5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
                      href={`/gaadigear/products/${p.slug}`}
                      key={p.productId}
                    >
                      <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                        {p.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" src={p.thumbnailUrl} />
                        ) : (
                          <span className="text-[10px] text-slate-400">No image</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs font-bold text-slate-950">{p.title}</p>
                      <p className="text-xs font-black text-slate-950">₹{p.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-6 border-b border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4">
            {trustStrip.map(({ icon: Icon, label }) => (
              <div className="flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-600" key={label}>
                <Icon className="shrink-0 text-emerald-600" size={18} />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" id="shop-by-category">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Shop by category</h2>
            <Link className="text-sm font-bold text-emerald-700 hover:underline" href="/gaadigear/products">
              View all categories →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {l1Categories.map((c) => (
              <Link
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center transition hover:border-emerald-300 hover:shadow-sm"
                href={`/gaadigear/products?category=${c.slug}`}
                key={c.id}
              >
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-emerald-50 text-emerald-700">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={c.name} className="h-full w-full object-cover" src={c.imageUrl} />
                  ) : (
                    <Tag size={20} />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-700">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <GearHomepageSections sections={homepageSections} />

        {featuredBrands.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">Shop by top brands</h2>
              <Link className="text-sm font-bold text-emerald-700 hover:underline" href="/gaadigear/products">
                View all brands →
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {featuredBrands.map((brand) => (
                <Link
                  className="flex h-14 min-w-28 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-300"
                  href={`/gaadigear/products?brand=${encodeURIComponent(brand.name)}`}
                  key={brand.id}
                >
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={brand.name} className="max-h-8 max-w-full object-contain" src={brand.logoUrl} />
                  ) : (
                    brand.name
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {facets.brands.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h2 className="text-lg font-black text-slate-950">Shop by brand</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {facets.brands.map((brand) => (
                <Link
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800"
                  href={`/gaadigear/products?brand=${encodeURIComponent(brand)}`}
                  key={brand}
                >
                  {brand}
                </Link>
              ))}
            </div>
          </section>
        )}

        <GearDealsCarousel products={newArrivals.products} title="New arrivals" viewAllHref="/gaadigear/products" />

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" id="find-your-vehicle">
          <div className="rounded-xl bg-lime-50 p-6 sm:p-8">
            <h2 className="text-lg font-black text-slate-950">Find the perfect fit for your vehicle</h2>
            <p className="mt-1 text-sm text-slate-600">Select your vehicle to see accessories that are 100% compatible.</p>
            <div className="mt-4 max-w-md">
              <GearVehiclePicker models={models} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
