import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { ExperienceWriteForm } from "@/components/public/ExperienceWriteForm";
import { getPublicBrandsWithModels } from "@/lib/services/public-data";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Share a Vehicle Experience | Gaadieasy",
  description:
    "Share your vehicle experience — buying journey, first ride, long-term ownership, dealer visit or service. Help future buyers and riders make better decisions.",
  alternates: { canonical: "/experiences/write" },
};

export default async function WriteExperiencePage({
  searchParams,
}: {
  searchParams: Promise<{ dealer?: string; city?: string; brand?: string; model?: string }>;
}) {
  const params = await searchParams;
  const brandsWithModels = await getPublicBrandsWithModels();
  const brandNames = brandsWithModels.map((b) => b.displayName);
  const brandModels = Object.fromEntries(brandsWithModels.map((b) => [b.displayName, b.models]));

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <Link
            href="/experiences"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft size={15} /> All experiences
          </Link>

          <div className="mt-6">
            <h1 className="text-3xl font-black text-slate-950">Share your experience</h1>
            <p className="mt-2 text-base text-slate-500">
              Bought a new vehicle? Took it on a long ride? Living with it for a year? Every experience — buying, riding, service, or ownership — helps thousands of people make a better decision.
            </p>
          </div>

          <div className="mt-7">
            <ExperienceWriteForm
              defaultDealer={params.dealer}
              defaultCity={params.city}
              defaultBrand={params.brand}
              defaultVehicleModel={params.model}
              brands={brandNames}
              brandModels={brandModels}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
