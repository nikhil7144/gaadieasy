import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/public/BrandLogo";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import { getVehicleStories, getVehicleStoryBySlug, getVehicleStoryUpdates } from "@/lib/services/vehicle-stories";

export const revalidate = 3600;

// Brand-only stories (no modelId) — the same split the sitemap uses.
export async function generateStaticParams() {
  const stories = await getVehicleStories({ activeOnly: true }).catch(() => []);
  return stories
    .filter((story) => !story.modelId)
    .map((story) => ({ brand: story.brandSlug, slug: story.slug.slice(story.brandSlug.length + 1) }));
}

type Props = { params: Promise<{ brand: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, slug } = await params;
  const story = await getVehicleStoryBySlug(brand, slug);
  if (!story) return { title: "Update not found" };

  return {
    title: story.seoTitle || `${story.title} | Gaadieasy`,
    description: story.seoDescription || story.intro,
    alternates: { canonical: `/brand-updates/${brand}/${slug}` },
    openGraph: {
      title: story.seoTitle || story.title,
      description: story.seoDescription || story.intro,
      images: story.heroImageUrl ? [{ url: story.heroImageUrl }] : [],
      type: "article",
    },
  };
}

export default async function BrandUpdatePage({ params }: Props) {
  const { brand: brandSlug, slug } = await params;

  const [story, { brands }] = await Promise.all([
    getVehicleStoryBySlug(brandSlug, slug),
    getBrowseDataSet(),
  ]);

  if (!story || story.modelId) notFound();

  const updates = await getVehicleStoryUpdates(story.id);
  const brand = brands.find((b) => b.slug === brandSlug);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/brands/${brandSlug}`} className="text-sm font-bold text-slate-400 hover:text-white">
                ← {story.brandName}
              </Link>
              <span className="text-slate-600">/</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">Brand news</span>
            </div>
            <p className="mt-4 text-sm font-bold text-emerald-400">{story.brandName}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">{story.title}</h1>
            {story.tagline ? <p className="mt-3 text-xl font-bold text-slate-300">{story.tagline}</p> : null}
            {story.publishedAt ? (
              <p className="mt-4 text-sm text-slate-400">
                {new Date(story.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            ) : null}
          </div>
        </section>

        {story.heroImageUrl ? (
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="-mt-1 overflow-hidden rounded-b-2xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="aspect-[16/9] w-full object-cover" src={story.heroImageUrl} alt={story.title} />
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* Main */}
            <div>
              <p className="text-lg font-bold leading-8 text-slate-700">{story.intro}</p>

              {story.body ? <MarkdownBody className="mt-8">{story.body}</MarkdownBody> : null}

              {updates.length > 0 ? (
                <section className="mt-10">
                  <h2 className="text-xl font-black text-slate-950">Updates</h2>
                  <div className="relative mt-4 space-y-0">
                    <div className="absolute left-3 top-0 h-full w-px bg-slate-200" />
                    {updates.map((upd) => (
                      <div key={upd.id} className="relative pl-10">
                        <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-2 border-emerald-400 bg-white" />
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-black text-slate-950">{upd.title}</h3>
                            <time className="text-xs font-bold text-slate-400">
                              {new Date(upd.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </time>
                          </div>
                          {upd.body ? <MarkdownBody className="mt-2 text-sm">{upd.body}</MarkdownBody> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {brand ? (
                  <>
                    <BrandLogo className="h-12 w-20" name={brand.name} logoUrl={brand.logoUrl} />
                    <h3 className="mt-3 text-lg font-black text-slate-950">{brand.name}</h3>
                    {brand.tagline ? <p className="mt-1 text-sm text-slate-500">{brand.tagline}</p> : null}
                  </>
                ) : (
                  <p className="font-black text-slate-950">{story.brandName}</p>
                )}
                <div className="mt-4 space-y-2">
                  <Link
                    href={`/brands/${brandSlug}`}
                    className="block rounded-lg bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-lime-400"
                  >
                    View all {story.brandName} models →
                  </Link>
                  {brand?.overview ? (
                    <Link
                      href={`/brands/${brandSlug}/overview`}
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-black text-slate-700 hover:border-emerald-300"
                    >
                      About {story.brandName}
                    </Link>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
