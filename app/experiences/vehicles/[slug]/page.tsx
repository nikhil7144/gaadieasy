import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { getExperiencesByVehicleModel, summariseExperiences, type Experience } from "@/lib/services/experiences";
import { getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import { ArrowLeft, ShieldCheck, PenLine } from "lucide-react";

type RouteProps = { params: Promise<{ slug: string }> };

async function getVehicleModel(slug: string) {
  const data = await getBrowseDataSet();
  const model = data.models.find((m) => m.slug === slug && m.active);
  if (!model) return null;
  const brand = data.brands.find((b) => b.id === model.brandId);
  return { model, brand };
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVehicleModel(slug);
  if (!result) return { title: "Vehicle not found | Gaadieasy" };

  const { model, brand } = result;
  const experiences = await getExperiencesByVehicleModel(model.id, model.name);
  const summary = summariseExperiences(experiences);

  const modelLabel = brand ? `${brand.name} ${model.name}` : model.name;
  const title = `${modelLabel} Dealer Experiences – Real Buyer Reviews | Gaadieasy`;
  const description = summary && summary.count > 0
    ? `Read ${summary.count} real ${modelLabel} dealer experience${summary.count !== 1 ? "s" : ""}. ${summary.averageOverall.toFixed(1)}/5 average rating from ${summary.count} buyer${summary.count !== 1 ? "s" : ""} — sales behaviour, service quality, delivery time and pricing reviews.`
    : `Share and read dealer experiences for ${modelLabel}. Be the first to write a review — help future buyers know what to expect from showrooms across India.`;

  return {
    title,
    description,
    alternates: { canonical: `/experiences/vehicles/${slug}` },
    openGraph: { title, description },
  };
}

const VISIT_LABELS: Record<string, string> = {
  purchase: "Purchased",
  service: "Service visit",
  test_ride: "Test ride",
  enquiry: "Enquiry",
  other: "Visit",
};

function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  return (
    <span className={sz}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(value) ? "text-amber-400" : "text-slate-300"}>★</span>
      ))}
    </span>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs font-bold text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-black text-slate-700">{value.toFixed(1)}</span>
    </div>
  );
}

function ExperienceRow({ exp }: { exp: Experience }) {
  const date = new Date(exp.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
            {exp.reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-950">{exp.reviewerName}</span>
              {exp.emailVerified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  <ShieldCheck size={9} /> Verified
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">{date}</div>
          </div>
        </div>
        <div className="text-right">
          <Stars value={exp.overallRating} />
          <div className="mt-1 flex flex-wrap justify-end gap-1">
            {exp.visitType && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {VISIT_LABELS[exp.visitType] ?? exp.visitType}
              </span>
            )}
            {exp.dealerName && (
              <Link
                href={`/experiences/dealers/${exp.dealerSlug}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-emerald-700 underline-offset-1 hover:underline"
              >
                {exp.dealerName}, {exp.dealerCity}
              </Link>
            )}
          </div>
        </div>
      </div>

      {(exp.salesRating || exp.serviceRating || exp.waitTimeRating || exp.priceTransparencyRating) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {exp.salesRating && (
            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              Sales <span className="text-amber-500">{"★".repeat(exp.salesRating)}</span>
            </span>
          )}
          {exp.serviceRating && (
            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              Service <span className="text-amber-500">{"★".repeat(exp.serviceRating)}</span>
            </span>
          )}
          {exp.waitTimeRating && (
            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              Wait time <span className="text-amber-500">{"★".repeat(exp.waitTimeRating)}</span>
            </span>
          )}
          {exp.priceTransparencyRating && (
            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
              Price transparency <span className="text-amber-500">{"★".repeat(exp.priceTransparencyRating)}</span>
            </span>
          )}
        </div>
      )}

      {exp.title && <p className="mt-3 font-bold text-slate-800">&ldquo;{exp.title}&rdquo;</p>}
      {exp.pros && (
        <div className="mt-3 flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs text-emerald-500">✓</span>
          <p className="text-sm leading-6 text-slate-700">{exp.pros}</p>
        </div>
      )}
      {exp.cons && (
        <div className="mt-1 flex gap-2">
          <span className="mt-0.5 shrink-0 text-xs text-red-400">✗</span>
          <p className="text-sm leading-6 text-slate-700">{exp.cons}</p>
        </div>
      )}
      {exp.body && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{exp.body}</p>
      )}
    </div>
  );
}

export default async function VehicleExperiencesPage({ params }: RouteProps) {
  const { slug } = await params;
  const result = await getVehicleModel(slug);
  if (!result) notFound();

  const { model, brand } = result;
  const experiences = await getExperiencesByVehicleModel(model.id, model.name);
  const summary = summariseExperiences(experiences);

  const modelLabel = brand ? `${brand.name} ${model.name}` : model.name;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gaadieasy.com").replace(/\/$/, "");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: modelLabel,
      description: `${modelLabel} dealer experiences and reviews from real buyers across India.`,
      ...(summary && summary.count >= 3
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: summary.averageOverall.toFixed(1),
              reviewCount: summary.count,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      ...(experiences.length > 0
        ? {
            review: experiences.slice(0, 5).map((exp) => ({
              "@type": "Review",
              author: { "@type": "Person", name: exp.reviewerName },
              datePublished: exp.createdAt.split("T")[0],
              reviewRating: {
                "@type": "Rating",
                ratingValue: exp.overallRating,
                bestRating: 5,
                worstRating: 1,
              },
              ...(exp.title ? { name: exp.title } : {}),
              ...(exp.body || exp.pros ? { reviewBody: exp.body ?? exp.pros } : {}),
            })),
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Experiences", item: `${siteUrl}/experiences` },
        { "@type": "ListItem", position: 3, name: modelLabel, item: `${siteUrl}/experiences/vehicles/${slug}` },
      ],
    },
  ];

  const writeHref = `/experiences/write?model=${encodeURIComponent(model.name)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-slate-950 pb-10 pt-8 text-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Link
              href="/experiences"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-slate-200"
            >
              <ArrowLeft size={13} /> All experiences
            </Link>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex flex-wrap gap-2">
                  {brand && (
                    <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                      {brand.name}
                    </span>
                  )}
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-100">
                    Dealer experiences
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{modelLabel}</h1>
                <p className="mt-2 text-slate-300">Real buyer experiences — sales, service &amp; delivery</p>

                {summary && summary.count > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-4xl font-black text-white">{summary.averageOverall.toFixed(1)}</span>
                    <div>
                      <Stars value={summary.averageOverall} size="lg" />
                      <div className="text-xs text-slate-400">
                        {summary.count} experience{summary.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={writeHref}
                className="shrink-0 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400"
              >
                <PenLine size={14} className="mr-1.5 inline" />
                Write your experience
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {experiences.length > 0 ? (
            <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
              {/* Summary sidebar */}
              {summary && (
                <aside className="mb-6 lg:mb-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
                    <h2 className="font-black text-slate-950">Rating breakdown</h2>
                    <div className="mt-4 space-y-3">
                      <RatingBar label="Overall" value={summary.averageOverall} />
                      <RatingBar label="Sales team" value={summary.averageSales} />
                      <RatingBar label="Service quality" value={summary.averageService} />
                      <RatingBar label="Delivery wait" value={summary.averageWaitTime} />
                      <RatingBar label="Price transparency" value={summary.averagePriceTransparency} />
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Distribution</h3>
                      {([5, 4, 3, 2, 1] as const).map((star) => {
                        const count = summary.distribution[star] ?? 0;
                        const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 py-0.5">
                            <span className="w-3 text-xs font-bold text-slate-600">{star}</span>
                            <span className="text-xs text-amber-400">★</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-5 text-right text-xs text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    <Link
                      href={writeHref}
                      className="mt-5 block w-full rounded-lg bg-emerald-500 py-2.5 text-center text-xs font-black text-slate-950 transition hover:bg-lime-400"
                    >
                      + Add your experience
                    </Link>
                  </div>
                </aside>
              )}

              {/* Reviews list */}
              <div className="space-y-4">
                <h2 className="font-black text-slate-950">
                  {experiences.length} experience{experiences.length !== 1 ? "s" : ""}
                </h2>
                {experiences.map((exp) => (
                  <ExperienceRow key={exp.id} exp={exp} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
              <div className="text-4xl">🏍️</div>
              <p className="mt-4 text-lg font-black text-slate-800">No experiences yet for {modelLabel}</p>
              <p className="mt-2 text-sm text-slate-500">
                Be the first to share your dealer experience. Help future buyers know what to expect.
              </p>
              <Link
                href={writeHref}
                className="mt-5 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-400"
              >
                + Write first experience
              </Link>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
