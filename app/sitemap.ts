import type { MetadataRoute } from "next";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";
import { getVehicleStories } from "@/lib/services/vehicle-stories";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.gaadieasy.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [dataset, comparisonPages, allStories] = await Promise.all([
    getVehicleDataSet(),
    getComparisonPagesFromDb().catch(() => []),
    getVehicleStories({ activeOnly: true }).catch(() => []),
  ]);

  const { brands, models, variants, cities } = dataset;

  // Restrict on-road price URL coverage to the 3 highest-traffic metros — keeps the crawl
  // surface bounded instead of growing with every model added (was top-5-by-table-order).
  const priceCitySlugs = ["delhi", "mumbai", "bangalore"];
  const topCities = cities.map((c) => c.slug).filter((slug) => priceCitySlugs.includes(slug));
  const defaultCity = topCities[0] ?? "bangalore";

  const staticRoutes = [
    "/",
    "/discover",
    "/photos",
    "/dealer",
    "/dealer/login",
  ].map((path) => ({
    url: escapeXml(`${baseUrl}${path}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const brandRoutes = brands
    .filter((brand) => brand.active)
    .map((brand) => ({
      url: escapeXml(`${baseUrl}/brands/${brand.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const comparisonRoutes = comparisonPages
    .filter((page) => page.active)
    .map((page) => ({
      url: escapeXml(`${baseUrl}/compare/${page.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  // Build per-model price routes using the CANONICAL URL format:
  // brand + model + default-variant + city  (matches what generateMetadata sets as canonical)
  const priceRoutes: MetadataRoute.Sitemap = [];

  for (const model of models.filter((m) => m.active)) {
    const brand = brands.find((b) => b.id === model.brandId);
    if (!brand?.slug) continue; // skip if brand not found — avoids broken ?brand= URLs

    // Resolve default variant (same logic as calculateOnRoadPriceFromData)
    const modelVariants = variants
      .filter((v) => v.modelId === model.id && v.active)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.exShowroomPrice - b.exShowroomPrice);
    const defaultVariant = modelVariants.find((v) => v.isDefault) ?? modelVariants[0];
    if (!defaultVariant?.slug) continue; // skip if no variant

    // One URL per top city — each city gets its own indexed page
    for (const citySlug of topCities) {
      priceRoutes.push({
        url: escapeXml(
          `${baseUrl}/on-road-price?brand=${brand.slug}&model=${model.slug}&variant=${defaultVariant.slug}&city=${citySlug}`,
        ),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: citySlug === defaultCity ? 0.72 : 0.65,
      });
    }
  }

  // Brand overview pages (only when brand has overview text)
  const brandOverviewRoutes = brands
    .filter((b) => b.active && b.overview)
    .map((b) => ({
      url: escapeXml(`${baseUrl}/brands/${b.slug}/overview`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  // Brand-only stories (model_id = null) — each has its own /vehicle-updates URL
  const brandStoryRoutes = allStories
    .filter((s) => s.active && !s.modelId)
    .map((s) => {
      const storyPath = s.slug.slice(s.brandSlug.length + 1);
      return {
        url: escapeXml(`${baseUrl}/brand-updates/${s.brandSlug}/${storyPath}`),
        lastModified: new Date(s.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });

  return [...staticRoutes, ...brandRoutes, ...brandOverviewRoutes, ...comparisonRoutes, ...priceRoutes, ...brandStoryRoutes];
}
