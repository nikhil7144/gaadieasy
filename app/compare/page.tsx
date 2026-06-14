import type { Metadata } from "next";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { brands, cities, models, variants } from "@/lib/data";
import { calculateOnRoadPrice } from "@/lib/services/pricing";
import { formatShortPrice } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Vehicle comparison",
  description: "Compare vehicle prices, specs, safety and ownership cost side by side before you buy.",
  alternates: {
    canonical: "/compare",
  },
};

export default function ComparePage() {
  const city = cities[0];
  const selected = [models[0], models[1], models[2]].filter(Boolean);
  const comparisons = selected.map((model) => {
    const brand = brands.find((item) => item.id === model.brandId);
    const variant = variants.find((item) => item.modelId === model.id);
    const pricing = calculateOnRoadPrice({ brand: brand?.slug, model: model.slug, variant: variant?.slug, city: city.slug });
    return { model, brand, variant, pricing };
  });
  type ComparisonItem = (typeof comparisons)[number];
  const rows: Array<[string, (item: ComparisonItem) => string]> = [
    ["Body type", (item) => item.model.bodyType],
    ["Fuel", (item) => item.variant?.fuelType ?? "-"],
    ["Transmission", (item) => item.variant?.transmission ?? "-"],
    ["Engine", (item) => item.variant?.engineCapacity ?? "-"],
    ["Mileage", (item) => item.variant?.mileage ?? "-"],
    ["Safety", (item) => item.variant?.specifications.safety.rating ?? "-"],
    ["Top features", (item) => item.variant?.specifications.features.slice(0, 3).join(", ") ?? "-"],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <p className="text-sm font-bold text-lime-300">Vehicle comparison</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight">Compare cars by price, specs, features and ownership cost.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50">
              The comparison page should work like a decision table: choose city, add vehicles, compare on-road price, variants, engine, safety, features, colors, dealer offers and EMI estimate.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {comparisons.map(({ model, brand, variant, pricing }) => (
              <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={model.id}>
                <div className="aspect-[4/3] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-emerald-700">{brand?.name}</div>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{model.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{variant?.name}</p>
                  <div className="mt-4 rounded-lg bg-lime-300 p-3">
                    <div className="text-xs font-bold uppercase text-slate-700">On-road in {city.name}</div>
                    <div className="mt-1 text-xl font-black text-slate-950">{formatShortPrice(pricing.breakdown.totalOnRoadPrice)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Parameter</th>
                  {comparisons.map(({ model }) => <th className="p-4" key={model.id}>{model.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(([label, getValue]) => (
                  <tr key={String(label)}>
                    <td className="p-4 font-black text-slate-950">{String(label)}</td>
                    {comparisons.map((item) => (
                      <td className="p-4 text-slate-600" key={item.model.id}>{getValue(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
