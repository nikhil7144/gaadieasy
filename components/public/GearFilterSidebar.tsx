"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GEAR_PRICE_BUCKETS } from "@/lib/utils/gear-price-buckets";

type Category = { id: string; name: string; slug: string; level: number; parentId?: string };

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <button
        className="flex w-full items-center justify-between text-left text-xs font-black uppercase tracking-wide text-slate-950"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Real, functional filters -- category is a link tree (single-select via
// navigation, so URLs stay shareable), price/brand are checkboxes that OR
// together and merge into whatever's already in the URL (switching category
// doesn't wipe an active brand/price filter, and vice versa). Works on both
// the PLP (updates the grid in place) and the homepage (navigates into the
// PLP with the filter pre-applied) since both just read/patch search params.
export function GearFilterSidebar({
  categories,
  activeCategorySlug,
  brands,
  categoryCounts,
  brandCounts,
  priceBucketCounts,
}: {
  categories: Category[];
  activeCategorySlug?: string;
  brands: string[];
  categoryCounts?: Record<string, number>;
  brandCounts?: Record<string, number>;
  priceBucketCounts?: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const l1 = categories.filter((c) => c.level === 1);
  const l2ByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.level === 2 && c.parentId) {
      const list = l2ByParent.get(c.parentId) ?? [];
      list.push(c);
      l2ByParent.set(c.parentId, list);
    }
  }
  const activeL1 = l1.find(
    (c) => c.slug === activeCategorySlug || (l2ByParent.get(c.id) ?? []).some((child) => child.slug === activeCategorySlug),
  );

  const selectedBrands = searchParams.getAll("brand_in");
  const selectedBuckets = (searchParams.get("price_buckets") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);

  function buildHref(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("cursor");
    return `/gaadigear/products?${params.toString()}`;
  }

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("cursor");
    router.push(`/gaadigear/products?${params.toString()}`);
  }

  function toggleBrand(brand: string) {
    navigate((params) => {
      const current = new Set(params.getAll("brand_in"));
      if (current.has(brand)) current.delete(brand);
      else current.add(brand);
      params.delete("brand_in");
      for (const b of current) params.append("brand_in", b);
    });
  }

  function toggleBucket(index: number) {
    navigate((params) => {
      const current = new Set(selectedBuckets);
      if (current.has(index)) current.delete(index);
      else current.add(index);
      if (current.size) params.set("price_buckets", Array.from(current).join(","));
      else params.delete("price_buckets");
    });
  }

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Filters</p>

        <CollapsibleSection title="Category">
          <div className="space-y-1 text-sm">
            {l1.map((c) => {
              const children = l2ByParent.get(c.id) ?? [];
              const isActiveParent = c.id === activeL1?.id;
              const isActive = activeCategorySlug === c.slug;
              const count = categoryCounts?.[c.name] ?? 0;
              const clickable = isActive || !categoryCounts || count > 0;
              return (
                <div key={c.id}>
                  {clickable ? (
                    <Link
                      className={`flex items-center justify-between gap-2 py-1 font-bold ${isActive ? "text-emerald-700" : "text-slate-700 hover:text-emerald-700"}`}
                      href={buildHref({ category: c.slug, subcategory: undefined })}
                    >
                      <span>{c.name}</span>
                      {categoryCounts && <span className="text-xs font-bold text-slate-400">{count}</span>}
                    </Link>
                  ) : (
                    <span className="flex cursor-not-allowed items-center justify-between gap-2 py-1 font-bold text-slate-300">
                      <span>{c.name}</span>
                      <span className="text-xs font-bold text-slate-300">0</span>
                    </span>
                  )}
                  {isActiveParent && children.length > 0 && (
                    <div className="ml-3 space-y-1 border-l border-slate-100 pl-3">
                      {children.map((child) => {
                        const childActive = activeCategorySlug === child.slug;
                        const childCount = categoryCounts?.[child.name] ?? 0;
                        const childClickable = childActive || !categoryCounts || childCount > 0;
                        return childClickable ? (
                          <Link
                            className={`flex items-center justify-between gap-2 py-0.5 text-xs font-bold ${
                              childActive ? "text-emerald-700" : "text-slate-500 hover:text-emerald-700"
                            }`}
                            href={buildHref({ category: c.slug, subcategory: child.slug })}
                            key={child.id}
                          >
                            <span>{child.name}</span>
                            {categoryCounts && <span className="text-slate-400">{childCount}</span>}
                          </Link>
                        ) : (
                          <span className="flex cursor-not-allowed items-center justify-between gap-2 py-0.5 text-xs font-bold text-slate-300" key={child.id}>
                            <span>{child.name}</span>
                            <span>0</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Price">
          <div className="space-y-2 text-sm">
            {GEAR_PRICE_BUCKETS.map((bucket, i) => {
              const checked = selectedBuckets.includes(i);
              const count = priceBucketCounts?.[i] ?? 0;
              const disabled = !checked && Boolean(priceBucketCounts) && count === 0;
              return (
                <label
                  className={`flex items-center justify-between gap-2 font-bold ${disabled ? "cursor-not-allowed text-slate-300" : "text-slate-700"}`}
                  key={bucket.label}
                >
                  <span className="flex items-center gap-2">
                    <input checked={checked} disabled={disabled} onChange={() => toggleBucket(i)} type="checkbox" />
                    {bucket.label}
                  </span>
                  {priceBucketCounts && <span className={`text-xs ${disabled ? "text-slate-300" : "text-slate-400"}`}>{count}</span>}
                </label>
              );
            })}
          </div>
        </CollapsibleSection>

        {brands.length > 0 && (
          <CollapsibleSection title="Brand">
            <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {brands.map((brand) => {
                const checked = selectedBrands.includes(brand);
                const count = brandCounts?.[brand] ?? 0;
                const disabled = !checked && Boolean(brandCounts) && count === 0;
                return (
                  <label
                    className={`flex items-center justify-between gap-2 font-bold ${disabled ? "cursor-not-allowed text-slate-300" : "text-slate-700"}`}
                    key={brand}
                  >
                    <span className="flex items-center gap-2">
                      <input checked={checked} disabled={disabled} onChange={() => toggleBrand(brand)} type="checkbox" />
                      {brand}
                    </span>
                    {brandCounts && <span className={`text-xs ${disabled ? "text-slate-300" : "text-slate-400"}`}>{count}</span>}
                  </label>
                );
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
}
