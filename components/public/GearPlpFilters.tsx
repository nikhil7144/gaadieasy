"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GEAR_PRICE_BUCKETS } from "@/lib/utils/gear-price-buckets";

const fieldClass =
  "min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

// The real filtering UI now lives in GearFilterSidebar (category tree, price
// buckets, brand checkboxes). This is just the sort order, kept separate
// since it's an ordering preference, not a filter.
export function GearPlpSort({ className = "" }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("cursor");
    router.push(`/gaadigear/products?${params.toString()}`);
  }

  return (
    <select
      className={`${fieldClass} ${className}`}
      onChange={(e) => navigate({ sort: e.target.value || undefined })}
      value={searchParams.get("sort") ?? ""}
    >
      <option value="">Newest</option>
      <option value="price_asc">Price: low to high</option>
      <option value="price_desc">Price: high to low</option>
    </select>
  );
}

export function GearPlpAppliedFilters({
  vehicleTypes,
  categories,
}: {
  vehicleTypes: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function remove(...keys: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of keys) params.delete(key);
    router.push(`/gaadigear/products?${params.toString()}`);
  }

  function removeOneBrand(brand: string) {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = params.getAll("brand_in").filter((b) => b !== brand);
    params.delete("brand_in");
    for (const b of remaining) params.append("brand_in", b);
    router.push(`/gaadigear/products?${params.toString()}`);
  }

  function removeOneBucket(index: number) {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = (params.get("price_buckets") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((i) => i !== index);
    if (remaining.length) params.set("price_buckets", remaining.join(","));
    else params.delete("price_buckets");
    router.push(`/gaadigear/products?${params.toString()}`);
  }

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  const q = searchParams.get("q");
  if (q) chips.push({ key: "q", label: `"${q}"`, onRemove: () => remove("q") });
  const vehicleType = searchParams.get("vehicle_type");
  if (vehicleType) {
    chips.push({
      key: "vehicle_type",
      label: vehicleTypes.find((vt) => vt.slug === vehicleType)?.name ?? vehicleType,
      onRemove: () => remove("vehicle_type", "category"),
    });
  }
  const category = searchParams.get("category");
  if (category) chips.push({ key: "category", label: categories.find((c) => c.slug === category)?.name ?? category, onRemove: () => remove("category", "subcategory") });
  const brand = searchParams.get("brand");
  if (brand) chips.push({ key: "brand", label: brand, onRemove: () => remove("brand") });
  for (const b of searchParams.getAll("brand_in")) chips.push({ key: `brand_in-${b}`, label: b, onRemove: () => removeOneBrand(b) });
  const segment = searchParams.get("segment");
  if (segment) chips.push({ key: "segment", label: segment, onRemove: () => remove("segment") });
  const usage = searchParams.get("usage");
  if (usage) chips.push({ key: "usage", label: usage, onRemove: () => remove("usage") });
  const priceMin = searchParams.get("price_min");
  const priceMax = searchParams.get("price_max");
  if (priceMin || priceMax) chips.push({ key: "price", label: `₹${priceMin || 0}–₹${priceMax || "∞"}`, onRemove: () => remove("price_min", "price_max") });
  for (const i of (searchParams.get("price_buckets") ?? "").split(",").filter(Boolean).map(Number)) {
    const bucket = GEAR_PRICE_BUCKETS[i];
    if (bucket) chips.push({ key: `bucket-${i}`, label: bucket.label, onRemove: () => removeOneBucket(i) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
          key={chip.key}
          onClick={chip.onRemove}
          type="button"
        >
          {chip.label} ×
        </button>
      ))}
    </div>
  );
}
