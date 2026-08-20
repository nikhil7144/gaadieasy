import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getVehicleStories, getVehicleStoryBySlug, getVehicleStoryMedia, getVehicleStoryUpdates } from "@/lib/services/vehicle-stories";
import { getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import { formatShortPrice } from "@/lib/utils/format";
import type { VehicleStory } from "@/types/automobile";

const STATUS_CONFIG: Record<VehicleStory["launchStatus"], { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-amber-100 text-amber-800" },
  launched: { label: "Just Launched", className: "bg-emerald-100 text-emerald-800" },
  updated: { label: "Updated", className: "bg-blue-100 text-blue-800" },
  discontinued: { label: "Discontinued", className: "bg-slate-100 text-slate-600" },
};

export const revalidate = 3600;

// Model stories only (modelId set); brand-only stories live under /brand-updates.
// story.slug is "{brandSlug}-{path}" and the route segment is the path portion.
export async function generateStaticParams() {
  const stories = await getVehicleStories({ activeOnly: true }).catch(() => []);
  return stories
    .filter((story) => story.modelId)
    .map((story) => ({ brand: story.brandSlug, model: story.slug.slice(story.brandSlug.length + 1) }));
}

type Props = { params: Promise<{ brand: string; model: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params;
  const story = await getVehicleStoryBySlug(brand, model);
  if (!story) return { title: "Story not found" };

  return {
    title: story.seoTitle || story.title,
    description: story.seoDescription || story.intro,
    alternates: { canonical: `/vehicle-updates/${brand}/${model}` },
    openGraph: {
      title: story.seoTitle || story.title,
      description: story.seoDescription || story.intro,
      images: story.heroImageUrl ? [{ url: story.heroImageUrl }] : [],
      type: "article",
    },
  };
}

export default async function VehicleStoryPage({ params }: Props) {
  const { brand, model } = await params;

  const [story, { models, variants, brands }] = await Promise.all([
    getVehicleStoryBySlug(brand, model),
    getBrowseDataSet(),
  ]);

  if (!story) notFound();

  const [updates, media] = await Promise.all([
    getVehicleStoryUpdates(story.id),
    getVehicleStoryMedia(story.id),
  ]);

  const linkedModel = story.modelId ? models.find((m) => m.id === story.modelId) : undefined;
  const linkedBrand = linkedModel ? brands.find((b) => b.id === linkedModel.brandId) : undefined;
  const linkedVariants = linkedModel
    ? variants.filter((v) => v.modelId === linkedModel.id && v.active).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    : [];
  const defaultVariant = linkedVariants.find((v) => v.isDefault) ?? linkedVariants[0];
  const cfg = STATUS_CONFIG[story.launchStatus];

  const pricingUrl = linkedModel && linkedBrand
    ? `/on-road-price?brand=${linkedBrand.slug}&model=${linkedModel.slug}${defaultVariant ? `&variant=${defaultVariant.slug}` : ""}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        {/* Hero title card */}
        <section className="bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/vehicle-updates" className="text-sm font-bold text-slate-400 hover:text-white">
                ← Vehicle updates
              </Link>
              <span className="text-slate-600">/</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${cfg.className}`}>{cfg.label}</span>
            </div>
            <p className="mt-4 text-sm font-bold text-emerald-400">{story.brandName}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">{story.title}</h1>
            {story.tagline ? <p className="mt-3 text-xl font-bold text-slate-300">{story.tagline}</p> : null}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              {story.expectedLaunchDate && story.launchStatus === "upcoming" ? (
                <span>Expected: <strong className="text-white">{new Date(story.expectedLaunchDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              ) : null}
              {story.actualLaunchDate ? (
                <span>Launched: <strong className="text-white">{new Date(story.actualLaunchDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></span>
              ) : null}
              {linkedModel ? (
                <span>Listed on Gaadieasy: <strong className="text-lime-300">{linkedModel.name}</strong></span>
              ) : null}
            </div>
          </div>
        </section>

        {/* Hero image — full width, prominent below the title card */}
        {story.heroImageUrl ? (
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="-mt-1 overflow-hidden rounded-b-2xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="aspect-[16/9] w-full object-cover"
                src={story.heroImageUrl}
                alt={story.title}
              />
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

            {/* Main content */}
            <div>
              {/* Intro */}
              <p className="text-lg font-bold leading-8 text-slate-700">{story.intro}</p>

              {/* First gallery image — shown inline after intro */}
              {media.length > 0 ? (
                <figure className="mt-8 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="aspect-[16/9] w-full object-cover"
                    src={media[0].url}
                    alt={media[0].alt || story.title}
                  />
                  {media[0].alt ? (
                    <figcaption className="mt-2 text-center text-xs font-bold text-slate-400">{media[0].alt}</figcaption>
                  ) : null}
                </figure>
              ) : null}

              {/* Body (Markdown) */}
              {story.body ? (
                <MarkdownBody className="mt-8">{story.body}</MarkdownBody>
              ) : null}

              {/* Remaining gallery images after body */}
              {media.length > 1 ? (
                <section className="mt-10">
                  <h2 className="text-xl font-black text-slate-950">Photo gallery</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {media.slice(1).map((img) => (
                      <figure key={img.id} className="overflow-hidden rounded-lg bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="aspect-[4/3] w-full object-cover"
                          src={img.url}
                          alt={img.alt || story.title}
                        />
                      </figure>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Updates timeline */}
              {updates.length > 0 ? (
                <section className="mt-10">
                  <h2 className="text-xl font-black text-slate-950">Latest updates</h2>
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
                          {upd.body ? (
                            <MarkdownBody className="mt-2 text-sm">{upd.body}</MarkdownBody>
                          ) : null}
                          {upd.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="mt-3 w-full rounded-md object-cover" src={upd.imageUrl} alt={upd.title} />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {/* Sidebar — Gaadieasy pricing CTA */}
            <aside className="space-y-4">
              {linkedModel && linkedBrand ? (
                <div className="sticky top-20 rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-black uppercase text-emerald-700">Listed on Gaadieasy</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{linkedModel.name}</h3>
                  {linkedVariants.length > 0 ? (
                    <>
                      <p className="mt-1 text-sm text-slate-500">
                        Starting from{" "}
                        <strong className="text-slate-950">{formatShortPrice(linkedVariants[0]?.exShowroomPrice ?? 0)}</strong>
                        {" "}ex-showroom
                      </p>
                      <div className="mt-3 space-y-1">
                        {linkedVariants.slice(0, 4).map((v) => (
                          <div key={v.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <span className="font-bold text-slate-700">{v.name}</span>
                            <span className="font-black text-slate-950">{formatShortPrice(v.exShowroomPrice)}</span>
                          </div>
                        ))}
                        {linkedVariants.length > 4 ? (
                          <p className="px-3 text-xs font-bold text-slate-400">+{linkedVariants.length - 4} more variants</p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Pricing coming soon.</p>
                  )}
                  {pricingUrl ? (
                    <Link
                      href={pricingUrl}
                      className="mt-4 block rounded-lg bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-lime-400"
                    >
                      Check on-road price →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5">
                  <p className="text-xs font-black uppercase text-slate-400">Pricing</p>
                  <p className="mt-2 text-sm font-bold text-slate-600">
                    On-road pricing not yet available for this model. We will update this page when it goes live.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase text-slate-500">Stay updated</p>
                <p className="mt-2 text-sm text-slate-600">
                  Bookmark this page — we post launch dates, price reveals and variant updates here as they happen.
                </p>
                <Link href="/vehicle-updates" className="mt-3 block text-sm font-black text-emerald-700 hover:text-emerald-900">
                  ← All vehicle stories
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
