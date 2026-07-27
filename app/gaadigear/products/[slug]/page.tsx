import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GearProductDetail } from "@/components/public/GearProductDetail";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getGearProductBySlug, getGearProductsPLP, getPublicGearCategories } from "@/lib/services/gear-public";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getGearProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description?.slice(0, 160),
  };
}

export default async function GaadiGearProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getGearProductBySlug(slug);
  if (!product) notFound();

  const [relatedResult, categories, cart] = await Promise.all([
    product.categorySlug ? getGearProductsPLP({ category: product.categorySlug, limit: 8 }) : Promise.resolve({ products: [] }),
    getPublicGearCategories(),
    getCart(),
  ]);
  const related = relatedResult.products.filter((p) => p.slug !== product.slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 md:pb-0">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />

      <div className="relative bg-slate-950">
        <div className="relative mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
            <Link className="hover:text-white hover:underline" href="/">
              Home
            </Link>
            <span>/</span>
            <Link className="hover:text-white hover:underline" href="/gaadigear">
              GaadiGear
            </Link>
            {product.parentCategory && (
              <>
                <span>/</span>
                <Link className="hover:text-white hover:underline" href={`/gaadigear/products?category=${product.parentCategory.slug}`}>
                  {product.parentCategory.name}
                </Link>
              </>
            )}
            {product.categoryName && (
              <>
                <span>/</span>
                <Link className="hover:text-white hover:underline" href={`/gaadigear/products?category=${product.categorySlug}`}>
                  {product.categoryName}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <GearProductDetail product={product} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {product.description && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Product details</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{product.description}</p>
              </div>
            )}

            {Object.keys(product.attributes).length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Specifications</p>
                <dl className="mt-3 divide-y divide-slate-100 text-sm">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div className="flex justify-between py-2" key={key}>
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="font-bold text-slate-950">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.usageTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.usageTags.map((tag) => (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">GST ({product.gstRate}%) included in price.</p>
          </div>

          <aside className="h-fit rounded-lg border border-lime-200 bg-lime-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Why buy on GaadiGear</p>
            <ul className="mt-3 space-y-2 text-sm font-bold text-slate-800">
              <li>✓ Scoped to exactly what fits your vehicle</li>
              <li>✓ Verified sellers, GST invoice on every order</li>
              <li>✓ 3-day return window from delivery</li>
            </ul>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Keep exploring</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">You may also like</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {related.map((p) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  href={`/gaadigear/products/${p.slug}`}
                  key={p.productId}
                >
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={p.title} className="h-full w-full object-cover" src={p.thumbnailUrl} />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-950">{p.title}</p>
                  <p className="mt-1 text-sm font-black text-emerald-700">₹{p.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
