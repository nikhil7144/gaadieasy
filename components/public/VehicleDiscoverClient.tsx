"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { BrandLogo } from "@/components/public/BrandLogo";
import { VehicleCompareModal } from "@/components/public/VehicleCompareModal";
import { VehicleImage } from "@/components/public/VehicleImage";
import {
  getDiscoveryTab,
  parseFilterParam,
  type DiscoveryFilter,
  type DiscoveryModel,
  type DiscoveryType,
  type TruckFinderGroup,
} from "@/lib/services/discovery";
import { formatShortPrice } from "@/lib/utils/format";
import type { Brand, City } from "@/types/automobile";

type VehicleDiscoverClientProps = {
  models: DiscoveryModel[];
  brands: Brand[];
  cities: City[];
  initialType?: string;
  initialCity?: string;
  initialFilters?: string;
  initialBrands?: string;
  initialSort?: string;
  initialPriceMin?: string;
  initialPriceMax?: string;
  initialEngineMin?: string;
  initialEngineMax?: string;
  initialPowerMin?: string;
  initialPowerMax?: string;
  initialPayloadMin?: string;
  initialPayloadMax?: string;
};

type RangeState = {
  priceMin: string;
  priceMax: string;
  engineMin: string;
  engineMax: string;
  powerMin: string;
  powerMax: string;
  payloadMin: string;
  payloadMax: string;
};

type RangeKey = keyof RangeState;
type SortOption = "relevance" | "price-low" | "price-high" | "newest" | "power-high" | "payload-high";

type RangeSection = {
  title: string;
  hint: string;
  minKey: RangeKey;
  maxKey: RangeKey;
  minLabel: string;
  maxLabel: string;
};

function parsePositiveNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseRangeState(values: Partial<Record<RangeKey, string>>): RangeState {
  return {
    priceMin: values.priceMin ?? "",
    priceMax: values.priceMax ?? "",
    engineMin: values.engineMin ?? "",
    engineMax: values.engineMax ?? "",
    powerMin: values.powerMin ?? "",
    powerMax: values.powerMax ?? "",
    payloadMin: values.payloadMin ?? "",
    payloadMax: values.payloadMax ?? "",
  };
}

function hasRangeSelection(ranges: RangeState) {
  return Object.values(ranges).some(Boolean);
}

function countRangeSelections(ranges: RangeState) {
  return Object.values(ranges).filter(Boolean).length;
}

function buildDiscoverUrl(
  type: string,
  city: string,
  filters: string[],
  brands: string[],
  ranges: RangeState,
  sort: SortOption,
) {
  const params = new URLSearchParams({ type, city });
  if (filters.length) params.set("filters", filters.join(","));
  if (brands.length) params.set("brands", brands.join(","));

  const rangeEntries = Object.entries(ranges) as [RangeKey, string][];
  rangeEntries.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  if (sort !== "relevance") params.set("sort", sort);
  return `/discover?${params.toString()}`;
}

function groupedFilters(activeTab: ReturnType<typeof getDiscoveryTab>): TruckFinderGroup[] {
  if (activeTab.truckFinderGroups?.length) return activeTab.truckFinderGroups;

  const find = (slugs: string[]) => activeTab.filters.filter((filter) => slugs.includes(filter.slug));
  const used = new Set<string>();
  let groups: TruckFinderGroup[] = [];

  if (activeTab.key === "cars") {
    groups = [
      { key: "bodyType", label: "Body type", filters: find(["suv", "hatchback", "sedan", "muv"]) },
      { key: "truckType", label: "Transmission", filters: find(["automatic", "manual"]) },
      { key: "fuel", label: "Fuel", filters: find(["petrol", "diesel", "cng", "electric"]) },
      { key: "application", label: "Seating", filters: find(["5-seater", "6-seater", "7-seater"]) },
    ];
  } else if (activeTab.key === "bikes" || activeTab.key === "scooters") {
    groups = [
      {
        key: "bodyType",
        label: "Type",
        filters: find(["commuter", "cruiser", "sports", "naked-sports", "super-bikes", "scooter", "family-scooter"]),
      },
      {
        key: "tonnage",
        label: "Capacity",
        filters: find(["under-125cc", "under-250cc", "250-500cc", "above-500cc", "above-650cc", "above-900cc"]),
      },
      { key: "application", label: "Power", filters: find(["under-20-ps", "20-40-ps", "above-40-ps"]) },
      { key: "fuel", label: "Fuel", filters: find(["petrol", "electric", "fast-charging", "100-km-range"]) },
    ];
  } else if (activeTab.key === "ev") {
    groups = [
      {
        key: "bodyType",
        label: "Vehicle type",
        filters: find(["electric-cars", "electric-scooters", "electric-bikes", "car", "bike", "scooter"]),
      },
      { key: "tonnage", label: "Range", filters: find(["under-100-km", "100-250-km", "250-km-plus", "100-km-range", "300-km-range"]) },
      { key: "fuel", label: "Charging", filters: find(["fast-charging"]) },
    ];
  } else if (activeTab.key === "passenger-ev") {
    groups = [
      { key: "bodyType", label: "Vehicle type", filters: find(["e-rickshaw", "e-auto"]) },
      { key: "application", label: "Usage", filters: find(["city-passenger", "shared-mobility", "route-use", "route-permit"]) },
      { key: "fuel", label: "Charging", filters: find(["fast-charging"]) },
    ];
  } else {
    groups = [
      { key: "loaderSize", label: "Size", filters: find(["small-loader", "medium-loader", "large-loader"]) },
      {
        key: "truckType",
        label: "Vehicle type",
        filters: find(["pickup", "mini-truck", "trucks", "light-commercial", "cargo", "3-wheeler", "4-wheeler", "6-wheeler"]),
      },
      {
        key: "application",
        label: "Usage",
        filters: find([
          "e-commerce-goods",
          "fmcg-logistics",
          "agricultural-products",
          "construction-material",
          "mining",
          "steel-logistics",
          "container-logistics",
          "cold-chain",
          "city-delivery",
          "fleet-operations",
          "fleet-use",
        ]),
      },
      {
        key: "tonnage",
        label: "Loading capacity",
        filters: find([
          "under-750-kg",
          "750-kg-1-5-ton",
          "1-5-3-ton",
          "3-7-5-ton",
          "7-5-19-ton",
          "20-55-ton",
          "under-1-ton",
          "1-2-ton",
          "2-ton-plus",
        ]),
      },
      {
        key: "bodyType",
        label: "Container type",
        filters: find(["open-body", "closed-container", "flatbed", "tipper-body", "tanker-body", "reefer-body", "box-body", "cab-chassis"]),
      },
      { key: "fuel", label: "Fuel type", filters: find(["diesel", "cng", "lng", "electric"]) },
    ];
  }

  groups = groups.filter((group) => group.filters.length);
  groups.forEach((group) => group.filters.forEach((filter) => used.add(filter.slug)));
  const moreFilters = activeTab.filters.filter((filter) => !used.has(filter.slug));
  if (moreFilters.length) groups.push({ key: "more", label: "More", filters: moreFilters });
  return groups;
}

function getPrimaryVariant(model: DiscoveryModel) {
  return model.variants.find((v) => v.active && v.isDefault) ?? model.variants.find((v) => v.active) ?? model.variants[0];
}

function getEngineCc(model: DiscoveryModel) {
  const match = getPrimaryVariant(model)?.engineCapacity?.replaceAll(",", "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function getPower(model: DiscoveryModel) {
  // compareSummary.maxPower already resolves engine.maxPower -> bike.power -> commercial.power
  // server-side; see deriveCompareSummary().
  const candidate = getPrimaryVariant(model)?.compareSummary?.maxPower;
  const match = candidate?.replaceAll(",", "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function getPayloadKg(model: DiscoveryModel) {
  // compareSummary.loadCapacity resolves the commercial payload/loading-capacity keys
  // server-side; the ton -> kg conversion stays here because the raw string is preserved.
  const candidate = getPrimaryVariant(model)?.compareSummary?.loadCapacity;
  if (typeof candidate !== "string") return undefined;

  const match = candidate.replaceAll(",", "").match(/\d+(\.\d+)?/);
  if (!match) return undefined;

  const value = Number(match[0]);
  return candidate.toLowerCase().includes("ton") ? value * 1000 : value;
}

function rangeSectionsForType(type: DiscoveryType): RangeSection[] {
  if (type === "cars") {
    return [
      {
        title: "Price range",
        hint: "Set ex-showroom budget in INR.",
        minKey: "priceMin",
        maxKey: "priceMax",
        minLabel: "Min price",
        maxLabel: "Max price",
      },
      {
        title: "Engine / CC",
        hint: "Narrow by engine size.",
        minKey: "engineMin",
        maxKey: "engineMax",
        minLabel: "Min cc",
        maxLabel: "Max cc",
      },
    ];
  }

  if (type === "bikes" || type === "scooters" || type === "ev") {
    return [
      {
        title: "Price range",
        hint: "Set ex-showroom budget in INR.",
        minKey: "priceMin",
        maxKey: "priceMax",
        minLabel: "Min price",
        maxLabel: "Max price",
      },
      {
        title: "Engine / CC",
        hint: "Useful for ICE bikes and scooters.",
        minKey: "engineMin",
        maxKey: "engineMax",
        minLabel: "Min cc",
        maxLabel: "Max cc",
      },
      {
        title: "Power",
        hint: "Filter by PS / hp-style values.",
        minKey: "powerMin",
        maxKey: "powerMax",
        minLabel: "Min power",
        maxLabel: "Max power",
      },
    ];
  }

  return [
    {
      title: "Price range",
      hint: "Set ex-showroom budget in INR.",
      minKey: "priceMin",
      maxKey: "priceMax",
      minLabel: "Min price",
      maxLabel: "Max price",
    },
    {
      title: "Payload",
      hint: "Set approximate payload in kg.",
      minKey: "payloadMin",
      maxKey: "payloadMax",
      minLabel: "Min kg",
      maxLabel: "Max kg",
    },
    {
      title: "Power",
      hint: "Useful for larger trucks and EV cargo.",
      minKey: "powerMin",
      maxKey: "powerMax",
      minLabel: "Min power",
      maxLabel: "Max power",
    },
  ];
}

function sortOptionsForType(type: DiscoveryType) {
  const base: { value: SortOption; label: string }[] = [
    { value: "relevance", label: "Recommended" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "newest", label: "Newest first" },
  ];

  if (type === "commercial" || type === "ev-commercial" || type === "passenger-ev") {
    return [...base, { value: "payload-high", label: "Payload: high to low" }, { value: "power-high", label: "Power: high to low" }];
  }

  if (type === "cars" || type === "bikes" || type === "scooters" || type === "ev") {
    return [...base, { value: "power-high", label: "Power: high to low" }];
  }

  return base;
}

function passesRanges(model: DiscoveryModel, ranges: RangeState) {
  const variant = getPrimaryVariant(model);
  const price = variant?.exShowroomPrice;
  const engine = getEngineCc(model);
  const power = getPower(model);
  const payload = getPayloadKg(model);

  const checks: Array<[RangeKey, number | undefined]> = [
    ["priceMin", price],
    ["priceMax", price],
    ["engineMin", engine],
    ["engineMax", engine],
    ["powerMin", power],
    ["powerMax", power],
    ["payloadMin", payload],
    ["payloadMax", payload],
  ];

  return checks.every(([key, actual]) => {
    const expected = parsePositiveNumber(ranges[key]);
    if (typeof expected !== "number") return true;
    if (typeof actual !== "number") return false;
    if (key.endsWith("Min")) return actual >= expected;
    return actual <= expected;
  });
}

function sortModels(models: DiscoveryModel[], sort: SortOption) {
  if (sort === "relevance" || sort === "newest") return models;

  return [...models].sort((left, right) => {
    if (sort === "price-low") {
      return (getPrimaryVariant(left)?.exShowroomPrice ?? Number.MAX_SAFE_INTEGER) - (getPrimaryVariant(right)?.exShowroomPrice ?? Number.MAX_SAFE_INTEGER);
    }

    if (sort === "price-high") {
      return (getPrimaryVariant(right)?.exShowroomPrice ?? 0) - (getPrimaryVariant(left)?.exShowroomPrice ?? 0);
    }

    if (sort === "power-high") {
      return (getPower(right) ?? -1) - (getPower(left) ?? -1);
    }

    if (sort === "payload-high") {
      return (getPayloadKg(right) ?? -1) - (getPayloadKg(left) ?? -1);
    }

    return 0;
  });
}

// Collapsible filter group — tapping header expands/collapses the options
function FilterGroup({
  filters,
  label,
  selectedFilters,
  setSelectedFilters,
  defaultOpen = true,
}: {
  filters: DiscoveryFilter[];
  label: string;
  selectedFilters: string[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<string[]>>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showMore, setShowMore] = useState(false);
  const filterSlugs = filters.map((f) => f.slug);
  const activeInGroup = filters.filter((f) => selectedFilters.includes(f.slug));
  const visibleFilters = showMore ? filters : filters.slice(0, 6);
  const hiddenCount = Math.max(filters.length - visibleFilters.length, 0);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900">{label}</span>
          {activeInGroup.length > 0 && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
              {activeInGroup.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="pb-4">
          <div className="flex flex-wrap gap-2">
            {visibleFilters.map((filter) => {
              const selected = selectedFilters.includes(filter.slug);
              return (
                <button
                  className={`rounded-full border px-3.5 py-2 text-sm font-black transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                  onClick={() =>
                    setSelectedFilters((current) =>
                      current.includes(filter.slug)
                        ? current.filter((slug) => slug !== filter.slug)
                        : [...current.filter((slug) => !filterSlugs.includes(slug)), filter.slug],
                    )
                  }
                  type="button"
                  key={filter.slug}
                >
                  {filter.label}
                </button>
              );
            })}
            {(hiddenCount > 0 || showMore) ? (
              <button
                className="rounded-full border border-slate-300 px-3.5 py-2 text-sm font-black text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
                onClick={() => setShowMore((v) => !v)}
                type="button"
              >
                {showMore ? "Show less" : `+${hiddenCount} more`}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible range input section
function RangeInputs({
  config,
  ranges,
  setRanges,
  defaultOpen = true,
}: {
  config: RangeSection;
  ranges: RangeState;
  setRanges: React.Dispatch<React.SetStateAction<RangeState>>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasValue = Boolean(ranges[config.minKey] || ranges[config.maxKey]);

  return (
    <div className="border-b border-slate-200">
      <button
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900">{config.title}</span>
          {hasValue && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">✓</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-4">
          <p className="mb-3 text-xs text-slate-500">{config.hint}</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{config.minLabel}</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                inputMode="numeric"
                min={0}
                placeholder={config.minLabel}
                type="number"
                value={ranges[config.minKey]}
                onChange={(event) => setRanges((current) => ({ ...current, [config.minKey]: event.target.value }))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">{config.maxLabel}</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                inputMode="numeric"
                min={0}
                placeholder={config.maxLabel}
                type="number"
                value={ranges[config.maxKey]}
                onChange={(event) => setRanges((current) => ({ ...current, [config.maxKey]: event.target.value }))}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function VehicleDiscoverClient({
  brands,
  models,
  cities,
  initialType = "cars",
  initialCity = "bangalore",
  initialFilters = "",
  initialBrands = "",
  initialSort = "relevance",
  initialPriceMin = "",
  initialPriceMax = "",
  initialEngineMin = "",
  initialEngineMax = "",
  initialPowerMin = "",
  initialPowerMax = "",
  initialPayloadMin = "",
  initialPayloadMax = "",
}: VehicleDiscoverClientProps) {
  const activeTab = getDiscoveryTab(initialType);
  const filterGroups = groupedFilters(activeTab);
  const brandList = useMemo(
    () => [...brands].sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name)),
    [brands],
  );

  const skipUrlSync = useRef(true);
  const skipFetch = useRef(true);
  const fetchSeq = useRef(0);
  const [citySlug, setCitySlug] = useState(initialCity);
  const [brandQuery, setBrandQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState(() => parseFilterParam(initialFilters));
  const [activeBrands, setActiveBrands] = useState(() => parseFilterParam(initialBrands));
  const [activeSort, setActiveSort] = useState<SortOption>((initialSort as SortOption) || "relevance");
  const [activeRanges, setActiveRanges] = useState(() =>
    parseRangeState({
      priceMin: initialPriceMin,
      priceMax: initialPriceMax,
      engineMin: initialEngineMin,
      engineMax: initialEngineMax,
      powerMin: initialPowerMin,
      powerMax: initialPowerMax,
      payloadMin: initialPayloadMin,
      payloadMax: initialPayloadMax,
    }),
  );
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [apiModels, setApiModels] = useState<DiscoveryModel[]>(models);

  // Sync URL on every filter change via replaceState (no back-button history spam)
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    window.history.replaceState(
      null,
      "",
      buildDiscoverUrl(activeTab.key, citySlug, activeFilters, activeBrands, activeRanges, activeSort),
    );
  }, [activeTab.key, citySlug, activeFilters, activeBrands, activeRanges, activeSort]);

  // Re-fetch from API when chip filters or brand selection changes (skip initial mount — SSR models already filtered)
  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const seq = ++fetchSeq.current;
    const params = new URLSearchParams({ type: activeTab.key });
    if (activeFilters.length) params.set("filters", activeFilters.join(","));
    if (activeBrands.length) params.set("brands", activeBrands.join(","));
    fetch(`/api/public/discovery?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { models: DiscoveryModel[] } | null) => {
        if (data && seq === fetchSeq.current) setApiModels(data.models);
      })
      .catch(() => {});
  // activeTab.key can't change mid-lifecycle (tab switch = full page nav); intentionally excluded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters, activeBrands]);

  const activeFilterObjects = activeTab.filters.filter((f) => activeFilters.includes(f.slug));
  const rangeSections = rangeSectionsForType(activeTab.key);
  const sortOptions = sortOptionsForType(activeTab.key);
  const activeCount = activeFilters.length + activeBrands.length + countRangeSelections(activeRanges);
  const matchingBrands = brandList.filter((brand) =>
    brand.name.toLowerCase().includes(brandQuery.trim().toLowerCase()),
  );

  const results = sortModels(
    apiModels.filter((model) => passesRanges(model, activeRanges)),
    activeSort,
  );

  function resetFilters() {
    setActiveFilters([]);
    setActiveBrands([]);
    setActiveRanges(parseRangeState({}));
    setActiveSort("relevance");
    setFilterDrawerOpen(false);
  }

  return (
    <main className="bg-slate-50">
      {/* Page header */}
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Vehicle discover</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950">
                Find matching {activeTab.label.toLowerCase()}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Refine by brand, type, fuel, specs and budget, then open the exact model without losing your search.
              </p>
            </div>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">City</span>
              <select
                className="rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                value={citySlug}
                onChange={(event) => setCitySlug(event.target.value)}
              >
                {cities.map((city) => (
                  <option value={city.slug} key={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr]">
        {/* Desktop filter sidebar */}
        <aside className="hidden flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          {/* Sidebar header — stays pinned while content scrolls */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <span className="text-base font-black text-slate-900">{activeTab.label}</span>
              {activeCount > 0 && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-black text-white">
                  {activeCount}
                </span>
              )}
            </div>
            {activeCount > 0 && (
              <button
                className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-500 hover:border-slate-400 hover:text-slate-800"
                onClick={resetFilters}
                type="button"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {/* Active filter chips — also pinned */}
          {(activeBrands.length > 0 || activeFilters.length > 0 || hasRangeSelection(activeRanges)) ? (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-5 pb-4">
              {activeBrands.map((slug) => {
                const brand = brandList.find((item) => item.slug === slug);
                if (!brand) return null;
                return (
                  <button
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                    onClick={() => setActiveBrands((c) => c.filter((s) => s !== slug))}
                    type="button"
                    key={`chip-brand-${slug}`}
                  >
                    {brand.name} <X className="h-3 w-3" />
                  </button>
                );
              })}
              {activeFilters.map((slug) => {
                const filter = activeTab.filters.find((item) => item.slug === slug);
                if (!filter) return null;
                return (
                  <button
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                    onClick={() => setActiveFilters((c) => c.filter((s) => s !== slug))}
                    type="button"
                    key={`chip-filter-${slug}`}
                  >
                    {filter.label} <X className="h-3 w-3" />
                  </button>
                );
              })}
              {(Object.entries(activeRanges) as [RangeKey, string][]).map(([key, value]) =>
                value ? (
                  <button
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                    onClick={() => setActiveRanges((c) => ({ ...c, [key]: "" }))}
                    type="button"
                    key={`chip-range-${key}`}
                  >
                    {key.replace(/([A-Z])/g, " $1")}: {value} <X className="h-3 w-3" />
                  </button>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-slate-200 px-5 pb-5">
            {/* Brand section */}
            <div className="border-b border-slate-200">
              <div className="py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">Brand</span>
                  {activeBrands.length > 0 && (
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                      {activeBrands.length}
                    </span>
                  )}
                </div>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Search brand"
                    value={brandQuery}
                    onChange={(event) => setBrandQuery(event.target.value)}
                  />
                </div>
                <div className="no-scrollbar mt-3 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {matchingBrands.map((brand) => {
                    const selected = activeBrands.includes(brand.slug);
                    return (
                      <button
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? "border-emerald-500 bg-emerald-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                        onClick={() =>
                          setActiveBrands((current) =>
                            current.includes(brand.slug)
                              ? current.filter((s) => s !== brand.slug)
                              : [...current, brand.slug],
                          )
                        }
                        type="button"
                        key={brand.id}
                      >
                        <BrandLogo className="h-8 w-12 shrink-0" logoUrl={brand.logoUrl} name={brand.name} />
                        <div className="min-w-0 flex-1 truncate text-sm font-black">{brand.name}</div>
                        {selected && <span className="shrink-0 text-xs font-black text-emerald-600">✓</span>}
                      </button>
                    );
                  })}
                  {!matchingBrands.length && (
                    <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                      No brand matches.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {rangeSections.map((section) => (
              <RangeInputs
                config={section}
                ranges={activeRanges}
                setRanges={setActiveRanges}
                key={section.title}
              />
            ))}

            {filterGroups.map((group) => (
              <FilterGroup
                filters={group.filters}
                label={group.label}
                selectedFilters={activeFilters}
                setSelectedFilters={setActiveFilters}
                key={`${activeTab.key}-${group.key}`}
              />
            ))}
          </div>
        </aside>

        {/* Results column */}
        <div>
          {/* Mobile filter + sort bar */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <button
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              onClick={() => setFilterDrawerOpen(true)}
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="ml-0.5 rounded-full bg-lime-300 px-2 py-0.5 text-xs font-black text-slate-950">
                  {activeCount}
                </span>
              )}
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-500" />
              <select
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-800"
                value={activeSort}
                onChange={(event) => setActiveSort(event.target.value as SortOption)}
              >
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Results header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Results</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {results.length} {activeTab.label.toLowerCase()} found
                </h2>
                <p className="mt-1 hidden text-sm text-slate-500 lg:block">
                  Select filters on the left — results update instantly.
                </p>
                <p className="mt-1 text-sm text-slate-500 lg:hidden">Tap Filters to narrow your results.</p>
              </div>

              <label className="hidden space-y-2 lg:block">
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                </span>
                <select
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                  value={activeSort}
                  onChange={(event) => setActiveSort(event.target.value as SortOption)}
                >
                  {sortOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Active filter chips (removable) */}
            {(activeFilterObjects.length > 0 || activeBrands.length > 0 || hasRangeSelection(activeRanges) || activeSort !== "relevance") ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeBrands.map((slug) => {
                  const brand = brandList.find((item) => item.slug === slug);
                  return brand ? (
                    <button
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                      onClick={() => setActiveBrands((c) => c.filter((s) => s !== slug))}
                      type="button"
                      key={`res-brand-${slug}`}
                    >
                      {brand.name} <X className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
                {activeFilterObjects.map((filter) => (
                  <button
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                    onClick={() => setActiveFilters((c) => c.filter((s) => s !== filter.slug))}
                    type="button"
                    key={`res-filter-${filter.slug}`}
                  >
                    {filter.label} <X className="h-3 w-3" />
                  </button>
                ))}
                {(Object.entries(activeRanges) as [RangeKey, string][]).map(([key, value]) =>
                  value ? (
                    <button
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                      onClick={() => setActiveRanges((c) => ({ ...c, [key]: "" }))}
                      type="button"
                      key={`res-range-${key}`}
                    >
                      {key.replace(/([A-Z])/g, " $1")}: {value} <X className="h-3 w-3" />
                    </button>
                  ) : null,
                )}
                {activeSort !== "relevance" ? (
                  <button
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                    onClick={() => setActiveSort("relevance")}
                    type="button"
                  >
                    {sortOptions.find((o) => o.value === activeSort)?.label} <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Vehicle cards */}
          {results.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((model) => {
                const variant = activeTab.key === "ev"
                  ? (model.variants.find((v) => v.active && v.fuelType === "Electric") ?? getPrimaryVariant(model))
                  : getPrimaryVariant(model);
                const href = variant?.slug
                  ? `/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant.slug}&city=${citySlug}`
                  : `/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&city=${citySlug}`;

                return (
                  <div
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    key={model.id}
                  >
                    <Link href={href}>
                      <div className="relative aspect-[16/10] bg-slate-100">
                        <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                        {variant?.fuelType === "Electric" ? (
                          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-lime-300 px-2.5 py-1 text-[10px] font-black text-slate-950">
                            ⚡ EV
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                          <Link href={href}>
                            <h3 className="mt-1 text-xl font-black text-slate-950 hover:text-emerald-700">{model.name}</h3>
                          </Link>
                        </div>
                        <VehicleCompareModal models={models} brands={brands} cities={cities} initialModelId={model.id} citySlug={citySlug} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{model.bodyType}</p>
                      {model.loaderSize ? (
                        <div className="mt-2 inline-flex rounded-full bg-lime-100 px-2.5 py-1 text-[11px] font-black uppercase text-lime-900">
                          {model.loaderSize} loader
                        </div>
                      ) : null}
                      {variant ? (
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                          <span className="rounded-md bg-slate-50 px-3 py-2">{variant.fuelType}</span>
                          <span className="rounded-md bg-slate-50 px-3 py-2">{variant.transmission}</span>
                          <span className="rounded-md bg-slate-50 px-3 py-2">{variant.engineCapacity}</span>
                          <span className="rounded-md bg-lime-100 px-3 py-2 text-lime-900">{formatShortPrice(variant.exShowroomPrice)}</span>
                        </div>
                      ) : null}
                      <Link
                        className="mt-4 block rounded-md bg-slate-950 px-3 py-2 text-center text-xs font-black text-white"
                        href={href}
                      >
                        Check on-road price
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-950">No exact matches found</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Remove one or two filters, widen the range values, or switch the selected brands to expand the results.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Mobile filter backdrop */}
      {filterDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setFilterDrawerOpen(false)}
        />
      )}

      {/* Mobile filter bottom drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-slate-200 bg-white transition-transform duration-300 ease-out lg:hidden ${
          filterDrawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drawer header */}
        <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <span className="text-base font-black text-slate-900">Filters</span>
              {activeCount > 0 && (
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-black text-white">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {activeCount > 0 && (
                <button
                  className="text-xs font-black text-slate-500 hover:text-slate-900"
                  onClick={resetFilters}
                  type="button"
                >
                  Clear all
                </button>
              )}
              <button
                className="rounded-full bg-slate-950 px-4 py-1.5 text-sm font-black text-white"
                onClick={() => setFilterDrawerOpen(false)}
                type="button"
              >
                Done ({results.length})
              </button>
            </div>
          </div>
        </div>

        {/* Drawer scrollable body */}
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {/* Brand section */}
          <div className="border-b border-slate-200">
            <div className="py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">Brand</span>
                {activeBrands.length > 0 && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                    {activeBrands.length}
                  </span>
                )}
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="Search brand"
                  value={brandQuery}
                  onChange={(event) => setBrandQuery(event.target.value)}
                />
              </div>
              <div className="no-scrollbar mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
                {matchingBrands.map((brand) => {
                  const selected = activeBrands.includes(brand.slug);
                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 text-slate-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                      onClick={() =>
                        setActiveBrands((current) =>
                          current.includes(brand.slug)
                            ? current.filter((s) => s !== brand.slug)
                            : [...current, brand.slug],
                        )
                      }
                      type="button"
                      key={`mb-br-${brand.id}`}
                    >
                      <BrandLogo className="h-8 w-12 shrink-0" logoUrl={brand.logoUrl} name={brand.name} />
                      <div className="min-w-0 flex-1 truncate text-sm font-black">{brand.name}</div>
                      {selected && <span className="shrink-0 text-xs font-black text-emerald-600">✓</span>}
                    </button>
                  );
                })}
                {!matchingBrands.length && (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No brand matches.</div>
                )}
              </div>
            </div>
          </div>

          {rangeSections.map((section) => (
            <RangeInputs
              config={section}
              ranges={activeRanges}
              setRanges={setActiveRanges}
              defaultOpen={false}
              key={`mb-${section.title}`}
            />
          ))}

          {filterGroups.map((group) => (
            <FilterGroup
              filters={group.filters}
              label={group.label}
              selectedFilters={activeFilters}
              setSelectedFilters={setActiveFilters}
              defaultOpen={false}
              key={`mb-${activeTab.key}-${group.key}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
