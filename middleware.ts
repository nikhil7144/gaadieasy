import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

// ─── Bot blocklist ────────────────────────────────────────────────────────────
// SEO audit tools and scrapers — block before any page function runs.
// Googlebot, Bingbot, and other real search engine crawlers are NOT listed here.
const BLOCKED_BOTS = [
  "serpstatbot",
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "petalbot",
  "baiduspider",
  "yandexbot",
  "majestic",
  "rogerbot",
  "exabot",
  "seznambot",
  "uptimerobot",
  "pingdom",
  "statuscake",
];

// These crawlers must always pass geo-blocking — they index the site for Google/Bing
const SEARCH_ENGINE_BOTS = [
  "googlebot",
  "bingbot",
  "duckduckbot",
  "slurp",         // Yahoo
  "ia_archiver",   // Wayback Machine
];

function isBlockedBot(ua: string): boolean {
  return BLOCKED_BOTS.some((bot) => ua.includes(bot));
}

function isSearchEngineBot(ua: string): boolean {
  return SEARCH_ENGINE_BOTS.some((bot) => ua.includes(bot));
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// 120 requests per minute per IP — high enough for real users with Next.js
// prefetching, low enough to stop scrapers
const LIMIT = 120;
const WINDOW = "1 m";

let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    prefix: "gaadieasy:rl",
  });
  return ratelimit;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(req: NextRequest) {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();

  // 1. Block known SEO scrapers immediately — no DB hit, no rate limit check
  if (isBlockedBot(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Geo-block: only serve India, except for real search engine crawlers
  //    x-vercel-ip-country is set by Vercel's edge network on every request
  const country = req.headers.get("x-vercel-ip-country");
  if (country && country !== "IN" && !isSearchEngineBot(ua)) {
    return new NextResponse("Service not available in your region.", {
      status: 403,
    });
  }

  // 3. Skip rate limiting for Next.js prefetch requests — these fire automatically
  //    for every visible link on page load and would false-positive real users
  if (req.headers.get("Next-Router-Prefetch") === "1") {
    return NextResponse.next();
  }

  // 4. Rate limit by IP
  const rl = getRatelimit();
  if (!rl) return NextResponse.next();

  const ip = getIp(req);
  const { success, limit, remaining, reset } = await rl.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return new NextResponse("Too many requests. Please slow down.", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(reset),
        "Content-Type": "text/plain",
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|robots|sitemap|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff2?)).*)",
  ],
};
