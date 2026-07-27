import Link from "next/link";
import type { Metadata } from "next";
import { GearPlpAppliedFilters, GearPlpSort } from "@/components/public/GearPlpFilters";
import { GearFilterSidebar } from "@/components/public/GearFilterSidebar";
import { GearProductGrid } from "@/components/public/GearProductGrid";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getSlimCatalog } from "@/lib/repositories/vehicle-data";
import { getGearFilterFacets, getGearProductsPLP, getPublicGearCategories, getPublicVehicleTypes } from "@/lib/services/gear-public";

export const metadata: Metadata = {
  title: "Shop accessories, parts & riding gear",
};

type SearchParams = {
  q?: string;
  vehicle_type?: string;
  category?: string;
  subcategory?: string;
  model_id?: string;
  brand_id?: string;
  brand?: string;
  brand_in?: string | string[];
  segment?: string;
  usage?: string;
  price_min?: string;
  price_max?: string;
  price_buckets?: string;
  sort?: "popularity" | "price_asc" | "price_desc";
};

export default async function GaadiGearProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const brandNames = params.brand_in ? (Array.isArray(params.brand_in) ? params.brand_in : [params.brand_in]) : undefined;
  const priceBuckets = params.price_buckets
    ? params.price_buckets
        .split(",")
        .map(Number)
        .filter((n) => !Number.isNaN(n))
    : undefined;

  const [vehicleTypes, categories, navCategories, facets, result, catalog, cart] = await Promise.all([
    getPublicVehicleTypes(),
    getPublicGearCategories(params.vehicle_type),
    getPublicGearCategories(),
    getGearFilterFacets({ vehicleType: params.vehicle_type, category: params.subcategory ?? params.category, q: params.q }),
    getGearProductsPLP({
      q: params.q,
      vehicleType: params.vehicle_type,
      category: params.subcategory ?? params.category,
      modelId: params.model_id,
      brandId: params.brand_id,
      brandName: params.brand,
      brandNames,
      segment: params.segment,
      usage: params.usage,
      priceMin: params.price_min ? Number(params.price_min) : undefined,
      priceMax: params.price_max ? Number(params.price_max) : undefined,
      priceBuckets,
      sort: params.sort,
    }),
    getSlimCatalog(),
    getCart(),
  ]);

  const contextModel = params.model_id ? catalog.models.find((m) => m.id === params.model_id) : undefined;
  const l1Categories = categories.filter((c) => c.level === 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader
        activeCategorySlug={params.category}
        cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)}
        categories={navCategories}
        initialQuery={params.q}
      />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center gap-1.5 text-xs text-white/60">
            <Link className="hover:text-white hover:underline" href="/">
              Home
            </Link>
            <span>/</span>
            <Link className="hover:text-white hover:underline" href="/gaadigear">
              GaadiGear
            </Link>
          </nav>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {params.q ? `Results for "${params.q}"` : contextModel ? `Gear for ${contextModel.name}` : "Shop all gear"}
              </h1>
              {(params.q || contextModel) && (
                <Link className="mt-1 inline-block text-xs font-bold text-lime-300 hover:underline" href="/gaadigear/products">
                  {params.q ? "Clear search" : "Clear vehicle filter"}
                </Link>
              )}
            </div>
            <span className="rounded-full bg-lime-300 px-4 py-1.5 text-xs font-black text-slate-950">
              Showing {result.products.length} product{result.products.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:flex lg:items-start">
        <GearFilterSidebar
          activeCategorySlug={params.subcategory ?? params.category}
          brandCounts={facets.brandCounts}
          brands={facets.brands}
          categories={categories}
          categoryCounts={facets.categoryCounts}
          priceBucketCounts={facets.priceBucketCounts}
        />

        <div className="mt-6 min-w-0 flex-1 lg:mt-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <GearPlpAppliedFilters categories={l1Categories} vehicleTypes={vehicleTypes} />
            <GearPlpSort className="ml-auto" />
          </div>

          <div className="mt-4">
            <GearProductGrid initialNextCursor={result.nextCursor} initialProducts={result.products} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
