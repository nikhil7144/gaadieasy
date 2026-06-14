"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { BrandLogo } from "@/components/public/BrandLogo";
import type { Brand } from "@/types/automobile";

type BrandShowcaseProps = {
  brands: Brand[];
  heading: string;
  eyebrow: string;
};

const PREVIEW_COUNT = 8;

export function BrandShowcase({ brands, heading, eyebrow }: BrandShowcaseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previewBrands = useMemo(() => brands.slice(0, PREVIEW_COUNT), [brands]);
  const showSeeMore = brands.length > PREVIEW_COUNT;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-700">{eyebrow}</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">{heading}</h2>
          </div>
          {showSeeMore ? (
            <button
              className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 transition hover:text-emerald-800"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              See more brands
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {previewBrands.map((brand) => (
            <Link
              className="group rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
              href={`/brands/${brand.slug}`}
              key={brand.id}
            >
              <div className="mx-auto grid h-16 place-items-center">
                <BrandLogo className="h-14 w-28" name={brand.name} logoUrl={brand.logoUrl} />
              </div>
              <div className="mt-3 text-sm font-black text-slate-950">{brand.name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">View prices</div>
            </Link>
          ))}
        </div>

        {showSeeMore ? (
          <div className="mt-4 flex justify-center md:hidden">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              Show all brands
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-700">{eyebrow}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">All brands</h3>
              </div>
              <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" onClick={() => setIsOpen(false)} type="button" aria-label="Close brands list">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore every available brand for this category and jump straight to its price pages.
            </p>

            <div className="mt-6 grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {brands.map((brand) => (
                <Link
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white"
                  href={`/brands/${brand.slug}`}
                  key={brand.id}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="mx-auto grid h-16 place-items-center">
                    <BrandLogo className="h-14 w-28" name={brand.name} logoUrl={brand.logoUrl} />
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-950">{brand.name}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">Open brand page</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
