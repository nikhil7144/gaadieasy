import { filterDiscoveryModels, getDiscoveryDatasetForType, getDiscoveryTab, parseFilterParam } from "@/lib/services/discovery";
import { getPublicDiscoveryDataForApi } from "@/lib/services/public-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = getDiscoveryTab(searchParams.get("type") ?? undefined).key;
  const filters = parseFilterParam(searchParams.get("filters") ?? undefined);
  const data = await getPublicDiscoveryDataForApi();
  const selectedData = getDiscoveryDatasetForType(data, type);
  const models = filterDiscoveryModels(selectedData.models, selectedData.tab, filters);

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
