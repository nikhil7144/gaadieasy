import { discoveryTabs, getDiscoveryTab } from "@/lib/services/discovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  if (typeParam) {
    const tab = getDiscoveryTab(typeParam);
    return Response.json({
      key: tab.key,
      label: tab.label,
      filters: tab.filters,
      truckFinderGroups: tab.truckFinderGroups ?? [],
    });
  }

  return Response.json({
    tabs: discoveryTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      filters: tab.filters,
      truckFinderGroups: tab.truckFinderGroups ?? [],
    })),
  });
}
