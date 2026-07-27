"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GearPlpProduct } from "@/components/public/GearProductGrid";

export function GearDealsCarousel({ title, viewAllHref, products }: { title: string; viewAllHref: string; products: GearPlpProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (products.length === 0) return null;

  function scroll(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <Link
          className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-emerald-700"
          href={viewAllHref}
        >
          View all
        </Link>
      </div>

      <div className="relative mt-4">
        <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2" ref={scrollRef}>
          {products.map((p) => {
            const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            return (
              <Link
                className="group relative w-40 shrink-0 rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:w-48"
                href={`/gaadigear/products/${p.slug}`}
                key={p.productId}
              >
                {discountPct > 0 && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                    {discountPct}% OFF
                  </span>
                )}
                <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-slate-50">
                  {p.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" src={p.thumbnailUrl} />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-950">{p.title}</p>
                {p.sellerName && <p className="truncate text-xs text-slate-500">{p.sellerName}</p>}
                {p.startingFrom && <p className="mt-0.5 text-[11px] font-bold text-slate-400">Starting from</p>}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-black text-slate-950">₹{p.price}</span>
                  {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>}
                </div>
              </Link>
            );
          })}
        </div>
        <button
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-md transition hover:border-emerald-300 hover:text-emerald-700 sm:block"
          onClick={() => scroll(-1)}
          type="button"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-md transition hover:border-emerald-300 hover:text-emerald-700 sm:block"
          onClick={() => scroll(1)}
          type="button"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
