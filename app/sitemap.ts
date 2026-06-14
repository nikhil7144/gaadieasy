import type { MetadataRoute } from "next";
import { brands, comparisonPages, cities, models, seoPages } from "@/lib/data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.gaadieasy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/discover",
    "/compare",
    "/on-road-price",
    "/photos",
    "/dealer",
    "/dealer/login",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const brandRoutes = brands
    .filter((brand) => brand.active)
    .map((brand) => ({
      url: `${baseUrl}/brands/${brand.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const seoRoutes = seoPages
    .filter((page) => page.active)
    .map((page) => ({
      url: `${baseUrl}/seo/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const comparisonRoutes = comparisonPages
    .filter((page) => page.active)
    .map((page) => ({
      url: `${baseUrl}/compare/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const priceRoutes = models
    .filter((model) => model.active)
    .map((model) => {
      const brand = brands.find((item) => item.id === model.brandId);
      const city = cities[0]?.slug ?? "bangalore";
      return {
        url: `${baseUrl}/on-road-price?brand=${brand?.slug ?? ""}&model=${model.slug}&city=${city}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      };
    });

  return [...staticRoutes, ...brandRoutes, ...seoRoutes, ...comparisonRoutes, ...priceRoutes];
}
