import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/public/LeadForm";
import { PriceBreakdown } from "@/components/public/PriceBreakdown";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getSeoPageResults } from "@/lib/services/seo";
import { formatShortPrice } from "@/lib/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = getSeoPageResults(slug);

  if (!result) {
    return {};
  }

  return {
    title: result.page.metaTitle,
    description: result.page.metaDescription,
  };
}

export default async function SeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getSeoPageResults(slug);

  if (!result) {
    notFound();
  }

  const primaryPricing = result.pricing[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-bold text-lime-300">Admin-controlled SEO page</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">{result.page.h1}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">{result.page.intro}</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-2xl font-black text-slate-950">{result.page.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{result.page.body}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {result.pricing.map((pricing) => (
                <a className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm" href={`/on-road-price?brand=${pricing.brand.slug}&model=${pricing.model.slug}&variant=${pricing.variant.slug}&city=${pricing.city.slug}`} key={pricing.variant.id}>
                  <div className="text-xs font-bold text-emerald-700">{pricing.brand.name}</div>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{pricing.model.name} {pricing.variant.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{pricing.variant.fuelType} - {pricing.variant.transmission}</p>
                  <div className="mt-3 inline-flex rounded-full bg-lime-300 px-3 py-1 text-sm font-black text-slate-950">
                    {formatShortPrice(pricing.breakdown.totalOnRoadPrice)}
                  </div>
                </a>
              ))}
            </div>
            {primaryPricing ? <PriceBreakdown pricing={primaryPricing} /> : null}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black text-slate-950">FAQs</h2>
              {result.page.faq.map((faq, index) => (
                <details className="mt-3" key={faq.question} open={index === 0}>
                  <summary className="cursor-pointer font-bold text-slate-800">{faq.question}</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {primaryPricing ? <LeadForm pricing={primaryPricing} source="seo_page" /> : null}
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
