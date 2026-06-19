import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { ExperienceCard } from "@/components/public/ExperienceCard";
import { ExperienceSearchBar } from "@/components/public/ExperienceSearchBar";
import { getExperiences } from "@/lib/services/experiences";
import { getPublicBrandDisplayNames } from "@/lib/services/public-data";
import { PenLine, Star, ShieldCheck, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Vehicle Experiences – Buying Journey, Riding Reviews & Ownership Stories | Gaadieasy",
  description:
    "Real vehicle experiences from real owners — buying journey, test rides, first impressions, long-term ownership and dealer visits. Share your own experience with cars, bikes, scooters and EVs.",
  alternates: { canonical: "/experiences" },
  openGraph: {
    title: "Vehicle Experiences – Buying Journey, Riding Reviews & Ownership Stories | Gaadieasy",
    description: "Read real buying and riding experiences for cars, bikes, scooters and EVs across India. Written by actual owners.",
  },
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gaadieasy.com").replace(/\/$/, "");

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Vehicle Experiences",
  description: "Real vehicle buying, riding and ownership experiences shared by owners across India.",
  url: `${siteUrl}/experiences`,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Vehicle Experiences", item: `${siteUrl}/experiences` },
    ],
  },
};

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; brand?: string }>;
}) {
  const params = await searchParams;
  const isFiltered = Boolean(params.q || params.city || params.brand);

  const [experiences, brandNames] = await Promise.all([
    getExperiences({ q: params.q, city: params.city, brand: params.brand, limit: 24 }),
    getPublicBrandDisplayNames(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-slate-950 pb-12 pt-10 text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                    <Star size={12} /> Vehicle experiences
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    <ShieldCheck size={12} /> Community-driven
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    Buying · Riding · Ownership
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                  Real experiences.<br />
                  <span className="text-lime-300">From real owners.</span>
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  From the showroom floor to long weekend rides — honest experiences from people who've bought, ridden and lived with their vehicles. Buying journey, first impressions, long-term ownership and dealer visits. All in one place.
                </p>
              </div>
              <Link
                href="/experiences/write"
                className="mt-2 shrink-0 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-400"
              >
                + Write your experience
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-3">
              {[
                { icon: PenLine, label: "Experiences shared", value: "Growing daily" },
                { icon: Star, label: "Models covered", value: "Cars, bikes, EVs" },
                { icon: TrendingUp, label: "Cities covered", value: "Across India" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-white/5 px-4 py-3">
                  <Icon size={16} className="text-emerald-400" />
                  <div className="mt-1 text-sm font-black text-white">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="mx-auto max-w-5xl">
            <ExperienceSearchBar defaultQ={params.q} defaultCity={params.city} defaultBrand={params.brand} brands={brandNames} />
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {isFiltered && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {experiences.length > 0
                    ? `${experiences.length} experience${experiences.length !== 1 ? "s" : ""} found`
                    : "No experiences found"}
                </h2>
                <p className="text-sm text-slate-500">
                  {[params.q && `Dealer: "${params.q}"`, params.city && `City: ${params.city}`, params.brand && `Brand: ${params.brand}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Link href="/experiences" className="text-sm font-bold text-emerald-600 hover:text-emerald-800">
                Clear filters
              </Link>
            </div>
          )}

          {!isFiltered && (
            <h2 className="mb-5 text-lg font-black text-slate-950">Recent experiences</h2>
          )}

          {experiences.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
              <div className="text-4xl">🏍️</div>
              <p className="mt-4 text-lg font-black text-slate-800">No experiences yet</p>
              <p className="mt-2 text-sm text-slate-500">
                {isFiltered
                  ? "Try a different search. No experiences match your current filters."
                  : "Be the first to share your vehicle experience!"}
              </p>
              <Link
                href="/experiences/write"
                className="mt-5 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400"
              >
                + Write first experience
              </Link>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-xl font-black text-slate-950">How it works</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Write your experience",
                  body: "Share any part of your vehicle journey — buying process, first ride, long-term ownership, service visit or a road trip. Takes 3 minutes.",
                },
                {
                  step: "02",
                  title: "Email verification (coming soon)",
                  body: "We'll verify your email to mark your experience as genuine. Verified experiences rank higher and build more trust.",
                },
                {
                  step: "03",
                  title: "Help the community",
                  body: "Your experience helps future buyers know what to expect — from the showroom to the open road.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 text-3xl font-black text-emerald-200">{step}</span>
                  <div>
                    <h3 className="font-black text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
