import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComparisonPricing } from "@/components/public/ComparisonPricing";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getComparisonPage } from "@/lib/services/comparisons";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await getComparisonPagesFromDb().catch(() => []);
  return pages.filter((page) => page.active).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparisonPage(slug);

  if (!comparison) {
    return {};
  }

  return {
    title: comparison.page.metaTitle,
    description: comparison.page.metaDescription,
  };
}

export default async function ComparisonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparisonPage(slug);

  if (!comparison) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-bold text-lime-300">Vehicle comparison</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{comparison.page.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">{comparison.page.intro}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <ComparisonPricing vehicles={comparison.vehicles} initialCity={comparison.city} cities={comparison.cities} />

          <section className="mt-6 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Buying verdict</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Which one should you choose?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{comparison.page.verdict}</p>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">FAQs</h2>
            {comparison.page.faq.map((faq, index) => (
              <details className="mt-4" open={index === 0} key={faq.question}>
                <summary className="cursor-pointer font-black text-slate-900">{faq.question}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
