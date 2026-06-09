import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getComparisonPage } from "@/lib/services/comparisons";
import { formatIndianPrice, formatShortPrice } from "@/lib/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonPage(slug);

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
  const comparison = getComparisonPage(slug);

  if (!comparison) {
    notFound();
  }

  const rows = [
    ["On-road price", (index: number) => formatIndianPrice(comparison.vehicles[index]?.breakdown.totalOnRoadPrice ?? 0)],
    ["Ex-showroom", (index: number) => formatShortPrice(comparison.vehicles[index]?.variant.exShowroomPrice ?? 0)],
    ["Fuel", (index: number) => comparison.vehicles[index]?.variant.fuelType ?? "-"],
    ["Transmission", (index: number) => comparison.vehicles[index]?.variant.transmission ?? "-"],
    ["Engine / Battery", (index: number) => comparison.vehicles[index]?.variant.engineCapacity ?? "-"],
    ["Mileage / Range", (index: number) => comparison.vehicles[index]?.variant.mileage ?? "-"],
    ["Seating", (index: number) => `${comparison.vehicles[index]?.variant.seatingCapacity ?? "-"} seats`],
    ["Body type", (index: number) => comparison.vehicles[index]?.model.bodyType ?? "-"],
    ["Safety", (index: number) => comparison.vehicles[index]?.variant.specifications.safety.rating ?? "-"],
    ["Top features", (index: number) => comparison.vehicles[index]?.variant.specifications.features.slice(0, 4).join(", ") ?? "-"],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-bold text-lime-300">SEO comparison</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">{comparison.page.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">{comparison.page.intro}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            {comparison.vehicles.map((vehicle) => (
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={vehicle.variant.id}>
                <div className="aspect-[16/10] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover" src={vehicle.model.imageUrl} alt={vehicle.model.name} />
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-emerald-700">{vehicle.brand.name}</div>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">{vehicle.model.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{vehicle.variant.name}</p>
                  <div className="mt-4 rounded-lg bg-lime-300 p-3">
                    <div className="text-xs font-bold uppercase text-slate-700">On-road in {comparison.city.name}</div>
                    <div className="mt-1 text-xl font-black text-slate-950">{formatIndianPrice(vehicle.breakdown.totalOnRoadPrice)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Parameter</th>
                  {comparison.vehicles.map((vehicle) => (
                    <th className="p-4" key={vehicle.variant.id}>{vehicle.brand.name} {vehicle.model.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(([label, getValue]) => (
                  <tr key={String(label)}>
                    <td className="p-4 font-black text-slate-950">{String(label)}</td>
                    {comparison.vehicles.map((vehicle, index) => (
                      <td className="p-4 text-slate-600" key={vehicle.variant.id}>{typeof getValue === "function" ? getValue(index) : ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="mt-6 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Admin verdict</p>
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
