"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export type GearPlpProduct = {
  productId: string;
  title: string;
  slug: string;
  categoryL1: string;
  categoryL2: string;
  brandName?: string;
  sellerName?: string;
  price: number;
  mrp: number;
  startingFrom: boolean;
  variantCount: number;
  ratingAvg: number;
  thumbnailUrl?: string;
};

function ProductCard({ p }: { p: GearPlpProduct }) {
  const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <Link
      className="group relative rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
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
      {p.sellerName && <p className="truncate text-xs text-slate-500">{p.sellerName}</p>}
      {p.startingFrom && <p className="mt-0.5 text-[11px] font-bold text-slate-400">Starting from</p>}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-black text-slate-950">₹{p.price}</span>
        {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">₹{p.mrp}</span>}
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        {p.ratingAvg > 0 && <span className="text-xs font-black text-amber-600">★ {p.ratingAvg.toFixed(1)}</span>}
        {p.variantCount > 1 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{p.variantCount} variants</span>
        )}
      </div>
    </Link>
  );
}

export function GearProductGrid({ initialProducts, initialNextCursor }: { initialProducts: GearPlpProduct[]; initialNextCursor: string | null }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", cursor);
      const response = await fetch(`/api/public/gaadigear/products?${params.toString()}`);
      const payload = await response.json();
      setProducts((prev) => [...prev, ...payload.products]);
      setCursor(payload.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">No products match these filters yet.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.productId} p={p} />
        ))}
      </div>
      {cursor && (
        <div className="mt-6 text-center">
          <button
            className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={loading}
            onClick={loadMore}
            type="button"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
