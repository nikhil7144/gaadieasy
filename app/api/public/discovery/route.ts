import { filterDiscoveryModels, getDiscoveryDatasetForType, getDiscoveryTab, parseFilterParam } from "@/lib/services/discovery";
import { getPublicDiscoveryDataForApi } from "@/lib/services/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = getDiscoveryTab(searchParams.get("type") ?? undefined).key;
  const filters = parseFilterParam(searchParams.get("filters") ?? undefined);
  const brandSlugs = parseFilterParam(searchParams.get("brands") ?? undefined);
  const data = await getPublicDiscoveryDataForApi();
  const selectedData = getDiscoveryDatasetForType(data, type);
  const chipFiltered = filterDiscoveryModels(selectedData.models, selectedData.tab, filters);
  const models = brandSlugs.length
    ? chipFiltered.filter((m) => brandSlugs.includes(m.brand?.slug ?? ""))
    : chipFiltered;

  return Response.json({
    type,
    city: searchParams.get("city") ?? undefined,
    filters,
    availableFilters: selectedData.tab.filters,
    truckFinderGroups: selectedData.tab.truckFinderGroups ?? [],
    brands: selectedData.brands,
    models,
  });
}
