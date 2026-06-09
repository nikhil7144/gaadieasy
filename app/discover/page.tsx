import type { Metadata } from "next";
import { VehicleDiscoverClient } from "@/components/public/VehicleDiscoverClient";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { getDiscoveryDatasetForType } from "@/lib/services/discovery";
import { getPublicDiscoveryDataForApi } from "@/lib/services/public-data";

export const metadata: Metadata = {
  title: "Discover vehicles by filters | AutoPrice",
  description: "Filter cars, bikes and commercial vehicles by body type, fuel, seating, engine and offers before checking on-road price.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; filters?: string; brands?: string }>;
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
        initialFilters={params.filters}
        initialType={selectedData.tab.key}
        models={selectedData.models}
      />
      <SiteFooter />
    </div>
  );
}
