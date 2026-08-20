import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/public/BrandLogo";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getBrandList, getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import { getVehicleStories } from "@/lib/services/vehicle-stories";

export const revalidate = 3600;

// Only brands that actually have overview copy — the others 404 / redirect anyway.
export async function generateStaticParams() {
  const brands = await getBrandList();
  return brands.filter((brand) => brand.active && brand.overview).map((brand) => ({ brand: brand.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const data = await getBrowseDataSet();
  const brand = data.brands.find((b) => b.slug === brandSlug && b.active);
  if (!brand) return { title: "Brand not found" };

  const title = brand.seoTitle ?? `About ${brand.name} – Brand Overview | Gaadieasy`;
  const description = brand.seoDescription ?? brand.overview?.slice(0, 160) ?? `Learn everything about ${brand.name} – history, lineup, and latest updates.`;

  return {
    title,
    description,
    alternates: { canonical: `/brands/${brandSlug}/overview` },
    openGraph: {
      title,
      description,
      images: brand.logoUrl ? [{ url: brand.logoUrl, alt: brand.name }] : [],
    },
  };
}

export default async function BrandOverviewPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandSlug } = await params;
  const data = await getBrowseDataSet();
  const brand = data.brands.find((b) => b.slug === brandSlug && b.active);
  if (!brand) notFound();

  const brandModels = data.models.filter((m) => m.brandId === brand.id && m.active);
  const bodyTypes = Array.from(new Set(brandModels.map((m) => m.bodyType).filter(Boolean)));

  const brandNews = await getVehicleStories({ activeOnly: true })
    .then((stories) => stories.filter((s) => s.brandSlug === brand.slug && !s.modelId))
    .catch(() => []);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link className="text-emerald-700 hover:text-emerald-900" href="/">Home</Link>
          <span>/</span>
          <Link className="text-emerald-700 hover:text-emerald-900" href={`/brands/${brand.slug}`}>{brand.name}</Link>
          <span>/</span>
          <span>Overview</span>
        </div>

        {/* Hero */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <BrandLogo className="h-20 w-32 shrink-0" name={brand.name} logoUrl={brand.logoUrl} />
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">{brand.name}</h1>
              {brand.tagline ? (
                <p className="mt-1 text-base font-semibold text-emerald-700">{brand.tagline}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {bodyTypes.slice(0, 5).map((t) => (
                  <span key={t} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overview body */}
        {brand.overview ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-black text-slate-950">About {brand.name}</h2>
            <MarkdownBody>{brand.overview}</MarkdownBody>
          </section>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Brand overview coming soon.
          </div>
        )}

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-3xl font-black text-slate-950">{brandModels.length}</div>
            <div className="mt-1 text-xs font-bold text-slate-500">Active models</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <div className="text-3xl font-black text-slate-950">{bodyTypes.length}</div>
            <div className="mt-1 text-xs font-bold text-slate-500">Body types</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center col-span-2 sm:col-span-1">
            <div className="text-3xl font-black text-slate-950">
              {data.variants.filter((v) => v.active && brandModels.some((m) => m.id === v.modelId)).length}
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">Total variants</div>
          </div>
        </div>

        {/* Brand news / updates */}
        {brandNews.length > 0 ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-xl font-black text-slate-950">{brand.name} updates</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {brandNews.map((story) => {
                const storyPath = story.slug.slice(story.brandSlug.length + 1);
                return (
                  <Link key={story.id} className="block p-5 hover:bg-emerald-50" href={`/brand-updates/${story.brandSlug}/${storyPath}`}>
                    <div className="text-xs font-black uppercase tracking-wide text-emerald-700">
                      {new Date(story.publishedAt ?? story.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-950">{story.title}</div>
                    {story.tagline ? <div className="mt-0.5 text-sm font-semibold text-slate-500">{story.tagline}</div> : null}
                    {story.intro ? <p className="mt-2 text-sm leading-6 text-slate-600">{story.intro}</p> : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* CTA back to models */}
        <div className="mt-8 flex justify-center">
          <Link
            className="rounded-lg bg-emerald-500 px-8 py-3 text-sm font-black text-slate-950 hover:bg-lime-400"
            href={`/brands/${brand.slug}`}
          >
            View all {brand.name} models &amp; prices
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
