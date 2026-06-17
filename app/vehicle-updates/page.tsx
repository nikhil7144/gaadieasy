import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getVehicleStories } from "@/lib/services/vehicle-stories";
import type { VehicleStory } from "@/types/automobile";

export const metadata: Metadata = {
  title: "Vehicle Updates & Launch Stories | Gaadieasy",
  description: "Follow the latest vehicle launches, price updates and stories from top car and bike brands in India — tracked and updated by Gaadieasy.",
  alternates: { canonical: "/vehicle-updates" },
};

const STATUS_CONFIG: Record<VehicleStory["launchStatus"], { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-amber-100 text-amber-800" },
  launched: { label: "Just Launched", className: "bg-emerald-100 text-emerald-800" },
  updated: { label: "Updated", className: "bg-blue-100 text-blue-800" },
  discontinued: { label: "Discontinued", className: "bg-slate-100 text-slate-600" },
};

function storyHref(story: VehicleStory) {
  const modelPart = story.slug.startsWith(`${story.brandSlug}-`)
    ? story.slug.slice(story.brandSlug.length + 1)
    : story.slug;
  return `/vehicle-updates/${story.brandSlug}/${modelPart}`;
}

export default async function VehicleUpdatesPage() {
  const stories = await getVehicleStories({ activeOnly: true, featuredFirst: true });
  const featured = stories.find((s) => s.featured);
  const rest = stories.filter((s) => !s.featured || s.id !== featured?.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        {/* Page header */}
        <section className="bg-slate-950 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <p className="inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
              Vehicle launch hub
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Vehicle updates & launch stories
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Follow upcoming launches, price reveals and model updates — all tracked in one place.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          {stories.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-500">No vehicle stories yet — check back soon.</p>
            </div>
          ) : (
            <>
              {/* Featured story */}
              {featured ? (
                <Link
                  href={storyHref(featured)}
                  className="group mb-8 grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-[1fr_1fr]"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-100 sm:aspect-auto">
                    {featured.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        src={featured.heroImageUrl}
                        alt={featured.title}
                      />
                    ) : (
                      <div className="grid h-full min-h-48 w-full place-items-center bg-slate-900">
                        <span className="text-3xl font-black text-lime-300">{featured.brandName.slice(0, 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-lime-300 px-2 py-0.5 text-[11px] font-black text-slate-950">Featured</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${STATUS_CONFIG[featured.launchStatus].className}`}>
                        {STATUS_CONFIG[featured.launchStatus].label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-emerald-700">{featured.brandName}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950 group-hover:text-emerald-700">{featured.title}</h2>
                    {featured.tagline ? <p className="mt-2 text-base font-bold text-slate-600">{featured.tagline}</p> : null}
                    <p className="mt-3 text-sm leading-6 text-slate-500 line-clamp-3">{featured.intro}</p>
                    <span className="mt-5 inline-flex w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white group-hover:bg-emerald-700">
                      Read story →
                    </span>
                  </div>
                </Link>
              ) : null}

              {/* Stories grid */}
              {rest.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((story) => {
                    const cfg = STATUS_CONFIG[story.launchStatus];
                    return (
                      <Link
                        key={story.id}
                        href={storyHref(story)}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                          {story.heroImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              src={story.heroImageUrl}
                              alt={story.title}
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center bg-slate-900">
                              <span className="text-2xl font-black text-lime-300">{story.brandName.slice(0, 1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${cfg.className}`}>
                              {cfg.label}
                            </span>
                            {story.expectedLaunchDate && story.launchStatus === "upcoming" ? (
                              <span className="text-[11px] font-bold text-slate-400">
                                Expected {new Date(story.expectedLaunchDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs font-bold text-emerald-700">{story.brandName}</p>
                          <h2 className="mt-1 text-base font-black text-slate-950 group-hover:text-emerald-700 line-clamp-2">
                            {story.title}
                          </h2>
                          <p className="mt-2 text-sm leading-5 text-slate-500 line-clamp-2">{story.intro}</p>
                          <span className="mt-3 inline-flex text-xs font-black text-emerald-700">Read story →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
