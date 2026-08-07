"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Internal-only surfaces -- excluded so staff usage never pollutes visitor
// journeys/campaign stats, and so the Meta Pixel never reports internal
// clicks as if they were real visitor/conversion activity. Seller's public
// marketing + registration flow lives entirely under /gaadigear/sell/**, so
// prefix-excluding /seller only ever catches the authenticated dashboard --
// but the dealer flow shares one prefix for both (/dealer/signup, /dealer/login,
// /dealer/verify-email are public; bare /dealer is the authenticated
// dashboard), so that one needs an exact-path exclusion instead of a prefix.
const EXCLUDED_PREFIXES = ["/admin", "/seller", "/api"];
const EXCLUDED_EXACT_PATHS = ["/dealer"];

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function isExcluded(pathname: string) {
  if (EXCLUDED_EXACT_PATHS.includes(pathname)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getOrCreateId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

type FbqQueueable = ((...args: unknown[]) => void) & {
  queue: unknown[][];
  loaded?: boolean;
  callMethod?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: FbqQueueable;
  }
}

function loadMetaPixel(pixelId: string) {
  if (window.fbq) {
    window.fbq("track", "PageView");
    return;
  }
  const stub = function (...args: unknown[]) {
    if (stub.callMethod) stub.callMethod.call(stub, ...args);
    else stub.queue.push(args);
  } as FbqQueueable;
  stub.queue = [];
  window.fbq = stub;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

// Mounted once in the root layout. On every path change it: (1) fires the
// Meta Pixel PageView (App Router does client-side nav, so the pixel's own
// auto-firing on initial script load isn't enough), and (2) logs a first-party
// pageview row -- visitor/session ids in storage, UTM params captured on
// first touch of the session -- so a session's full path sequence is a plain
// query, not something we depend on a third party to show us.
export function SiteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pixelLoaded = useRef(false);

  useEffect(() => {
    if (isExcluded(pathname)) return;

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId) {
      if (!pixelLoaded.current) {
        loadMetaPixel(pixelId);
        pixelLoaded.current = true;
      } else {
        window.fbq?.("track", "PageView");
      }
    }

    const visitorId = getOrCreateId(window.localStorage, "ge_visitor_id");
    const sessionId = getOrCreateId(window.sessionStorage, "ge_session_id");

    const utmFromUrl: Record<string, string> = {};
    let hasUtmInUrl = false;
    for (const key of UTM_KEYS) {
      const value = searchParams.get(key);
      if (value) {
        utmFromUrl[key] = value;
        hasUtmInUrl = true;
      }
    }
    // First-touch attribution within the session: only overwrite the stored
    // UTM when this pageview actually carries UTM params, so navigating to an
    // internal link mid-session doesn't erase how the visitor originally arrived.
    if (hasUtmInUrl) {
      window.sessionStorage.setItem("ge_utm", JSON.stringify(utmFromUrl));
    }
    const storedUtmRaw = window.sessionStorage.getItem("ge_utm");
    const utm = storedUtmRaw ? (JSON.parse(storedUtmRaw) as Record<string, string>) : undefined;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ visitorId, sessionId, path, referrer: document.referrer || undefined, utm }),
    }).catch(() => {
      // Analytics must never break the page.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()]);

  return null;
}
