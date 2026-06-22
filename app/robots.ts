import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.gaadieasy.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot", "serpstatbot", "PetalBot", "BaiduSpider", "YandexBot", "Majestic", "RogerBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
