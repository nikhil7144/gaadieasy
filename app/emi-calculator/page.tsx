import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { EmiCalculator } from "@/components/public/EmiCalculator";
import { getBrowseDataSet } from "@/lib/repositories/vehicle-data";
import type { City } from "@/types/automobile";

export const metadata: Metadata = {
  title: "Car EMI Calculator — Monthly Payment, Interest & Schedule | Gaadieasy",
  description:
    "Calculate your vehicle EMI with down payment, interest rate and tenure sliders. View month-by-month payment schedule, year-wise principal vs interest breakdown, and repayment charts.",
  alternates: { canonical: "/emi-calculator" },
};

type Props = {
  searchParams: Promise<{
    price?: string;
    name?: string;
    brand?: string;
    model?: string;
    variant?: string;
    city?: string;
  }>;
};

export default async function EmiCalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const price  = params.price ? Math.max(0, parseInt(params.price, 10)) || 1_000_000 : 1_000_000;
  const name   = params.name ?? undefined;

  let variants: { id: string; slug: string; name: string; exShowroomPrice: number }[] = [];
  let defaultVariantId: string | undefined;
  let cities: City[] = [];

  if (params.brand && params.model) {
    try {
      const data  = await getBrowseDataSet();
      const brand = data.brands.find((b) => b.slug === params.brand);
      const model = data.models.find((m) => m.slug === params.model && m.brandId === brand?.id);
      cities = data.cities;

      if (model) {
        const modelVariants = data.variants
          .filter((v) => v.modelId === model.id && v.active)
          .sort((a, b) => a.exShowroomPrice - b.exShowroomPrice);

        variants = modelVariants.map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          exShowroomPrice: v.exShowroomPrice,
        }));

        const matched = modelVariants.find((v) => v.slug === params.variant);
        defaultVariantId = matched?.id ?? modelVariants[0]?.id;
      }
    } catch {
      // fall back to price-only mode silently
    }
  }

  const effectivePrice = variants.find((v) => v.id === defaultVariantId)?.exShowroomPrice ?? price;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Finance planning</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950 sm:text-4xl">EMI Calculator</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Adjust the sliders to see your monthly EMI, total interest outgo, year-wise repayment split, and full month-by-month schedule.
          </p>
        </div>
        <EmiCalculator
          defaultVehiclePrice={effectivePrice}
          vehicleName={name}
          variants={variants}
          defaultVariantId={defaultVariantId}
          cities={cities}
          initialCitySlug={params.city}
          brandSlug={params.brand}
          modelSlug={params.model}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
