"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/public/BrandLogo";
import type { PublicSearchResult } from "@/lib/services/public-data";

async function fetchSearchResults(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/public/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  const payload = (await response.json()) as { results?: PublicSearchResult[] };
  return payload.results ?? [];
}

export function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= 1;
  const hasResults = results.length > 0;

  useEffect(() => {
    if (!shouldSearch) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const nextResults = await fetchSearchResults(trimmedQuery, controller.signal);
        setResults(nextResults);
        setOpen(true);
        setActiveIndex(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 90);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [shouldSearch, trimmedQuery]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const emptyState = useMemo(() => {
    if (!shouldSearch || loading || hasResults) return null;
    return `No matching brand or model for "${trimmedQuery}"`;
  }, [hasResults, loading, shouldSearch, trimmedQuery]);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setLoading(false);
    setActiveIndex(0);
  }

  return (
    <div className="w-full max-w-[760px]" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          aria-label="Search brand or model"
          className="h-12 w-full rounded-full border border-slate-200 bg-white pl-12 pr-12 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);

            if (!nextQuery.trim()) {
              setResults([]);
              setOpen(false);
              setLoading(false);
              setActiveIndex(0);
            }
          }}
          onFocus={() => {
            if (shouldSearch) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (!open || !results.length) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % results.length);
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => (current - 1 + results.length) % results.length);
            }

            if (event.key === "Enter") {
              event.preventDefault();
              router.push(results[activeIndex]?.href ?? "/");
              setOpen(false);
            }

            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search brand or model"
          value={query}
        />

        {query ? (
          <button
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={clearSearch}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && (loading || hasResults || emptyState) ? (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          {loading ? (
            <div className="px-4 py-3 text-sm font-medium text-slate-500">Searching...</div>
          ) : null}

          {!loading && hasResults ? (
            <div className="max-h-[28rem] overflow-y-auto py-2">
              {results.map((result, index) => (
                <Link
                  className={`flex items-center gap-3 px-4 py-3 transition ${
                    activeIndex === index ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                  href={result.href}
                  key={`${result.type}-${result.id}`}
                  onClick={() => setOpen(false)}
                >
                  <div className="shrink-0">
                    <BrandLogo
                      className="h-11 w-14"
                      logoUrl={result.logoUrl}
                      name={result.type === "brand" ? result.name : result.subtitle ?? result.name}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-slate-950">{result.name}</div>
                    <div className="truncate text-xs font-medium text-slate-500">
                      {result.type === "brand" ? "Brand" : "Model"}
                      {result.subtitle ? ` • ${result.subtitle}` : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {!loading && emptyState ? (
            <div className="px-4 py-3 text-sm font-medium text-slate-500">{emptyState}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
