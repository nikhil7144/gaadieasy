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
        // Image-indexing crawlers hit every <img> on every page (full-resolution,
        // hosted on Supabase Storage) — block them without blocking normal page crawling.
        userAgent: ["Googlebot-Image", "Bingbot-Image", "AdsBot-Google-Image", "Yahoo! Slurp"],
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
