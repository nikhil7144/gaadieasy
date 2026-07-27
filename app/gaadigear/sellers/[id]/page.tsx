import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Phone, Store } from "lucide-react";
import { GearSiteHeader } from "@/components/public/GearSiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getCart } from "@/lib/services/gear-cart";
import { getGearProductsBySeller, getPublicGearCategories, getPublicSellerProfile } from "@/lib/services/gear-public";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const seller = await getPublicSellerProfile(id);
  return { title: seller ? `${seller.businessName} — GaadiGear seller` : "Seller not found" };
}

export default async function GearSellerStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [seller, products, categories, cart] = await Promise.all([
    getPublicSellerProfile(id),
    getGearProductsBySeller(id),
    getPublicGearCategories(),
    getCart(),
  ]);
  if (!seller) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <GearSiteHeader cartCount={cart.items.reduce((sum, i) => sum + i.qty, 0)} categories={categories} />

      <div className="h-40 overflow-hidden bg-gradient-to-r from-emerald-800 to-slate-950 sm:h-56">
        {seller.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${seller.businessName} banner`} className="h-full w-full object-cover" src={seller.bannerUrl} />
        )}
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <section className="-mt-12 flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:-mt-14">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-emerald-50 text-emerald-700 shadow sm:h-24 sm:w-24">
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`${seller.businessName} logo`} className="h-full w-full object-cover" src={seller.logoUrl} />
            ) : (
              <Store size={32} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-950">{seller.brandName || seller.businessName}</h1>
            <p className="text-sm text-slate-500">
              {products.length} product{products.length === 1 ? "" : "s"} available
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-600">
            {seller.contactPhone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {seller.contactPhone}
              </span>
            )}
            {seller.contactEmail && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {seller.contactEmail}
              </span>
            )}
          </div>
        </section>

        {seller.about && (
          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">About {seller.brandName || seller.businessName}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{seller.about}</p>
          </section>
        )}

        {products.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">This seller doesn&apos;t have any live products right now.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((p) => (
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
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
