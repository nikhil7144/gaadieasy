"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GearHomepageSectionView } from "@/lib/services/gear-public";

function ProductCard({ p, className = "" }: { p: GearHomepageSectionView["products"][number]; className?: string }) {
  const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <Link
      className={`group relative rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md ${className}`}
      href={`/gaadigear/products/${p.slug}`}
    >
      {discountPct > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-black text-slate-950">{discountPct}% OFF</span>
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
      {p.startingFrom && <p className="mt-0.5 text-[11px] font-bold text-slate-400">Starting from</p>}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-base font-black text-slate-950">₹{p.price}</span>
        {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>}
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        {p.ratingAvg > 0 && <span className="text-xs font-black text-amber-600">★ {p.ratingAvg.toFixed(1)}</span>}
        {p.variantCount > 1 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{p.variantCount} variants</span>
        )}
      </div>
      <p className="mt-0.5 truncate text-[11px] font-bold text-emerald-700">{p.fitsSummary}</p>
    </Link>
  );
}

function SectionHeader({ section }: { section: GearHomepageSectionView }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
        {section.subtitle && <p className="mt-0.5 text-sm text-slate-500">{section.subtitle}</p>}
      </div>
      <Link className="shrink-0 text-sm font-bold text-emerald-700 hover:underline" href={`/gaadigear/collections/${section.collectionSlug}`}>
        View all →
      </Link>
    </div>
  );
}

// Horizontal scroll row with visible prev/next arrows, not just a bare
// touch/trackpad scroll affordance.
function CarouselSection({ section }: { section: GearHomepageSectionView }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (section.products.length === 0) return null;

  function scroll(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeader section={section} />
      <div className="relative mt-4">
        <div className="flex gap-4 overflow-x-auto scroll-smooth pb-2" ref={scrollRef}>
          {section.products.map((p) => (
            <ProductCard className="w-40 shrink-0 sm:w-48" key={p.productId} p={p} />
          ))}
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

// Static, non-scrolling multi-column grid -- wraps to as many rows as needed.
function GridSection({ section }: { section: GearHomepageSectionView }) {
  if (section.products.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeader section={section} />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {section.products.map((p) => (
          <ProductCard key={p.productId} p={p} />
        ))}
      </div>
    </section>
  );
}

// Spotlight layout -- 1-2 large cards, not a scroll row. For a collection's
// single hero product or a tight hand-picked pair, not a full assortment.
function FeaturedSection({ section }: { section: GearHomepageSectionView }) {
  if (section.products.length === 0) return null;
  const featured = section.products.slice(0, 2);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeader section={section} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {featured.map((p) => {
          const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
          return (
            <Link
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md sm:gap-6"
              href={`/gaadigear/products/${p.slug}`}
              key={p.productId}
            >
              <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50 sm:h-36 sm:w-36">
                {discountPct > 0 && (
                  <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                    {discountPct}% OFF
                  </span>
                )}
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={p.title} className="h-full w-full object-cover transition group-hover:scale-105" src={p.thumbnailUrl} />
                ) : (
                  <span className="text-xs text-slate-400">No image</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-slate-950 sm:text-lg">{p.title}</p>
                {p.startingFrom && <p className="mt-0.5 text-xs font-bold text-slate-400">Starting from</p>}
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-950 sm:text-2xl">₹{p.price}</span>
                  {p.mrp > p.price && <span className="text-sm text-slate-400 line-through">₹{p.mrp}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {p.ratingAvg > 0 && <span className="text-xs font-black text-amber-600">★ {p.ratingAvg.toFixed(1)}</span>}
                  {p.variantCount > 1 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{p.variantCount} variants</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs font-bold text-emerald-700">{p.fitsSummary}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function BannerRow({ sections }: { sections: GearHomepageSectionView[] }) {
  if (sections.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            className="group relative flex min-h-40 flex-col justify-end overflow-hidden rounded-xl bg-slate-950 p-5 text-white"
            href={`/gaadigear/collections/${section.collectionSlug}`}
            key={section.id}
          >
            {section.bannerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50 transition group-hover:scale-105"
                src={section.bannerImage}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="relative">
              <h3 className="text-lg font-black">{section.title}</h3>
              {section.subtitle && <p className="mt-1 text-xs text-white/70">{section.subtitle}</p>}
              <span className="mt-3 inline-block rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Admin-configured homepage sections, rendered by their display style. Banner
// sections are grouped into one grid row (mirroring the 4-card editorial row
// in the mockup); Carousel/Grid/Featured each have their own distinct layout.
// Hero sections are excluded here -- the hero is rendered separately at the
// page level (GAADIGEAR_SPEC.md §13.1), not as one of these merchandising rows.
// Purely config-driven -- adding/reordering/removing sections in
// /admin/gaadigear/collections changes this with no deploy.
export function GearHomepageSections({ sections }: { sections: GearHomepageSectionView[] }) {
  if (sections.length === 0) return null;
  const banners = sections.filter((s) => s.displayStyle === "banner");
  const rest = sections.filter((s) => s.displayStyle !== "banner" && s.displayStyle !== "hero");

  return (
    <>
      <BannerRow sections={banners} />
      {rest.map((section) => {
        if (section.displayStyle === "grid") return <GridSection key={section.id} section={section} />;
        if (section.displayStyle === "featured") return <FeaturedSection key={section.id} section={section} />;
        return <CarouselSection key={section.id} section={section} />;
      })}
    </>
  );
}
