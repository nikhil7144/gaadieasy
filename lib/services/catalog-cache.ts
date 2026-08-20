import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/repositories/vehicle-data";

// getBrowseDataSet / getSlimCatalog / getBrandList are persisted across requests by
// unstable_cache, so a catalog write is invisible to the public site until its tag is
// revalidated. revalidatePath() does NOT clear those entries — only revalidateTag does —
// so any mutation touching brands, models, variants, cities, media, categories or
// hero promotions must call this in addition to whatever paths it already revalidates.
//
// The "max" profile is Next 16's recommended form (the single-argument call is
// deprecated). It gives stale-while-revalidate: the first request after a write is
// served the old catalog while the refresh happens in the background, and every request
// after that is fresh. updateTag() would expire immediately instead, but it is only
// callable from Server Actions — these mutations all run in Route Handlers.
export function revalidateCatalog() {
  revalidateTag(CATALOG_TAG, "max");
}
