import type { MetadataRoute } from "next";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getComparisonPagesFromDb } from "@/lib/services/comparisons/db";

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

  const [dataset, comparisonPages] = await Promise.all([
    getVehicleDataSet(),
    getComparisonPagesFromDb().catch(() => []),
  ]);

  const { brands, models, cities } = dataset;
  const defaultCity = cities[0]?.slug ?? "bangalore";

  const staticRoutes = [
    "/",
    "/discover",
    "/on-road-price",
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

  const priceRoutes = models
    .filter((model) => model.active)
    .map((model) => {
      const brand = brands.find((item) => item.id === model.brandId);
      return {
        url: escapeXml(`${baseUrl}/on-road-price?brand=${brand?.slug ?? ""}&model=${model.slug}&city=${defaultCity}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      };
    });

  return [...staticRoutes, ...brandRoutes, ...comparisonRoutes, ...priceRoutes];
}
