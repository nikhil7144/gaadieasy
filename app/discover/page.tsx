import type { Metadata } from "next";
import { VehicleDiscoverClient } from "@/components/public/VehicleDiscoverClient";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getDiscoveryDatasetForType } from "@/lib/services/discovery";
import { getPublicDiscoveryDataForApi } from "@/lib/services/public-data";

export const metadata: Metadata = {
  title: "Discover Vehicles – Cars, Bikes, Scooters, EVs with On-Road Prices | Gaadieasy",
  description: "Filter cars, bikes, scooters and EVs by body type, fuel, seating, engine and budget. Check city-wise on-road prices before visiting a showroom.",
  alternates: {
    canonical: "/discover",
  },
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    city?: string;
    filters?: string;
    brands?: string;
    sort?: string;
    priceMin?: string;
    priceMax?: string;
    engineMin?: string;
    engineMax?: string;
    powerMin?: string;
    powerMax?: string;
    payloadMin?: string;
    payloadMax?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getPublicDiscoveryDataForApi();
  const selectedData = getDiscoveryDatasetForType(data, params.type);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <VehicleDiscoverClient
        brands={selectedData.brands}
        cities={data.cities}
        initialBrands={params.brands}
        initialCity={params.city}
        initialEngineMax={params.engineMax}
        initialEngineMin={params.engineMin}
        initialFilters={params.filters}
        initialPayloadMax={params.payloadMax}
        initialPayloadMin={params.payloadMin}
        initialPowerMax={params.powerMax}
        initialPowerMin={params.powerMin}
        initialPriceMax={params.priceMax}
        initialPriceMin={params.priceMin}
        initialSort={params.sort}
        initialType={selectedData.tab.key}
        models={selectedData.models}
      />
      <SiteFooter />
    </div>
  );
}
