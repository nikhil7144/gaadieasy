import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getPublicCollectionBySlug, getPublicGearCategories } from "@/lib/services/gear-public";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getPublicCollectionBySlug(slug);
  return { title: collection ? `${collection.name} — GaadiGear` : "Collection not found" };
}

export default async function GearCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [collection, categories, cart] = await Promise.all([getPublicCollectionBySlug(slug), getPublicGearCategories(), getCart()]);
  if (!collection) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#84cc16_0,transparent_34%),linear-gradient(135deg,#022c22,#0f172a_60%)] opacity-90" />
        {collection.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" src={collection.bannerImage} />
        )}
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
          <h1 className="mt-3 text-3xl font-black tracking-tight">{collection.name}</h1>
          {collection.description && <p className="mt-2 max-w-xl text-sm text-emerald-50">{collection.description}</p>}
          <span className="mt-3 inline-flex rounded-full bg-lime-300 px-4 py-1.5 text-xs font-black text-slate-950">
            {collection.products.length} product{collection.products.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {collection.products.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No products in this collection right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {collection.products.map((p) => {
              const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
              return (
                <Link
                  className="group relative rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  href={`/gaadigear/products/${p.slug}`}
                  key={p.productId}
                >
                  {discountPct > 0 && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                      {discountPct}% OFF
                    </span>
                  )}
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" src={p.thumbnailUrl} />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-950">{p.title}</p>
                  {p.startingFrom && <p className="mt-0.5 text-[11px] font-bold text-slate-400">Starting from</p>}
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-slate-950">₹{p.price}</span>
                    {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {p.ratingAvg > 0 && <span className="text-xs font-black text-amber-600">★ {p.ratingAvg.toFixed(1)}</span>}
                    {p.variantCount > 1 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{p.variantCount} variants</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-emerald-700">{p.fitsSummary}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
