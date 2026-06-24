import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

// ─── Bot blocklist ────────────────────────────────────────────────────────────
const BLOCKED_BOTS = [
  "serpstatbot", "ahrefsbot", "semrushbot", "mj12bot", "dotbot",
  "blexbot", "petalbot", "baiduspider", "yandexbot", "majestic",
  "rogerbot", "exabot", "seznambot", "uptimerobot", "pingdom", "statuscake",
];

// These must always pass geo-blocking — they index the site
const SEARCH_ENGINE_BOTS = ["googlebot", "google-inspectiontool", "bingbot", "duckduckbot", "slurp", "ia_archiver"];

function isBlockedBot(ua: string): boolean {
  return BLOCKED_BOTS.some((bot) => ua.includes(bot));
}

function isSearchEngineBot(ua: string): boolean {
  return SEARCH_ENGINE_BOTS.some((bot) => ua.includes(bot));
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// 120 requests per minute per IP for public traffic
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
  const { pathname } = req.nextUrl;
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();

  // Admin routes: skip all public-traffic checks — auth is handled by requirePlatformAdmin()
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // 1. Block known SEO scrapers
  if (isBlockedBot(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Geo-block: India only, except real search engine bots
  const country = req.headers.get("x-vercel-ip-country");
  if (country && country !== "IN" && !isSearchEngineBot(ua)) {
    return new NextResponse("Service not available in your region.", { status: 403 });
  }

  // 3. Skip rate limiting for Next.js prefetch requests
  if (req.headers.get("Next-Router-Prefetch") === "1") {
    return NextResponse.next();
  }

  // 4. Rate limit public traffic by IP — fail open if Redis is unavailable
  const rl = getRatelimit();
  if (!rl) return NextResponse.next();

  try {
    const { success, limit, remaining, reset } = await rl.limit(getIp(req));

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(limit));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  } catch {
    // Redis unavailable — fail open, don't block real users
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|robots|sitemap|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff2?)).*)",
  ],
};
