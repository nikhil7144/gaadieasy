"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { BrandLogo } from "@/components/public/BrandLogo";
import { VehicleImage } from "@/components/public/VehicleImage";
import {
  filterDiscoveryModels,
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
  return model.variants[0];
}

function getEngineCc(model: DiscoveryModel) {
  const match = getPrimaryVariant(model)?.engineCapacity?.replaceAll(",", "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function getPower(model: DiscoveryModel) {
  const variant = getPrimaryVariant(model);
  const engine = variant?.specifications?.engine as Record<string, unknown> | undefined;
  const bike = variant?.specifications?.bike as Record<string, unknown> | undefined;
  const commercial = variant?.specifications?.commercial as Record<string, unknown> | undefined;

  const candidates = [
    typeof engine?.maxPower === "string" ? engine.maxPower : undefined,
    typeof bike?.power === "string" ? bike.power : undefined,
    typeof commercial?.power === "string" ? commercial.power : undefined,
  ];

  for (const candidate of candidates) {
    const match = candidate?.replaceAll(",", "").match(/\d+(\.\d+)?/);
    if (match) return Number(match[0]);
  }

  return undefined;
}

function getPayloadKg(model: DiscoveryModel) {
  const commercial = getPrimaryVariant(model)?.specifications?.commercial as Record<string, unknown> | undefined;
  if (!commercial) return undefined;

  const candidates = [
    commercial.payload,
    commercial.payloadCapacity,
    commercial.loadingCapacity,
    commercial.loadCapacity,
    commercial.cargoCapacity,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const match = candidate.replaceAll(",", "").match(/\d+(\.\d+)?/);
    if (!match) continue;
    const value = Number(match[0]);
    if (candidate.toLowerCase().includes("ton")) return value * 1000;
    return value;
  }

  return undefined;
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

function FilterGroup({
  filters,
  label,
  selectedFilters,
  setSelectedFilters,
}: {
  filters: DiscoveryFilter[];
  label: string;
  selectedFilters: string[];
  setSelectedFilters: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleFilters = expanded ? filters : filters.slice(0, 6);
  const hiddenCount = Math.max(filters.length - visibleFilters.length, 0);
  const filterSlugs = filters.map((filter) => filter.slug);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{label}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Choose one</p>
        </div>
        <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-lime-300">
          {filters.length}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleFilters.map((filter) => {
          const selected = selectedFilters.includes(filter.slug);
          return (
            <button
              className={`rounded-full px-3.5 py-2 text-sm font-black transition ${
                selected ? "bg-lime-300 text-slate-950" : "bg-white/10 text-slate-100 hover:bg-white/15"
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
        {hiddenCount || expanded ? (
          <button
            className="rounded-full border border-white/15 px-3.5 py-2 text-sm font-black text-lime-300 hover:bg-white/10"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "Show less" : `More (${hiddenCount})`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RangeInputs({
  config,
  ranges,
  setRanges,
}: {
  config: RangeSection;
  ranges: RangeState;
  setRanges: React.Dispatch<React.SetStateAction<RangeState>>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-black text-white">{config.title}</h3>
      <p className="mt-1 text-xs text-slate-400">{config.hint}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">{config.minLabel}</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-lime-300"
            inputMode="numeric"
            min={0}
            placeholder={config.minLabel}
            type="number"
            value={ranges[config.minKey]}
            onChange={(event) => setRanges((current) => ({ ...current, [config.minKey]: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">{config.maxLabel}</span>
          <input
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-lime-300"
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
  const [citySlug, setCitySlug] = useState(initialCity);
  const [brandQuery, setBrandQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(() => parseFilterParam(initialFilters));
  const [appliedFilters, setAppliedFilters] = useState(() => parseFilterParam(initialFilters));
  const [selectedBrands, setSelectedBrands] = useState(() => parseFilterParam(initialBrands));
  const [appliedBrands, setAppliedBrands] = useState(() => parseFilterParam(initialBrands));
  const [selectedSort, setSelectedSort] = useState<SortOption>((initialSort as SortOption) || "relevance");
  const [appliedSort, setAppliedSort] = useState<SortOption>((initialSort as SortOption) || "relevance");
  const [selectedRanges, setSelectedRanges] = useState(() =>
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
  const [appliedRanges, setAppliedRanges] = useState(() =>
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

  const appliedFilterObjects = activeTab.filters.filter((filter) => appliedFilters.includes(filter.slug));
  const rangeSections = rangeSectionsForType(activeTab.key);
  const sortOptions = sortOptionsForType(activeTab.key);
  const selectedCount = selectedFilters.length + selectedBrands.length + countRangeSelections(selectedRanges);
  const matchingBrands = brandList.filter((brand) => brand.name.toLowerCase().includes(brandQuery.trim().toLowerCase()));

  const results = sortModels(
    filterDiscoveryModels(models, activeTab, appliedFilters)
      .filter((model) => !appliedBrands.length || appliedBrands.includes(model.brand?.slug ?? ""))
      .filter((model) => passesRanges(model, appliedRanges)),
    appliedSort,
  );

  function pushUrl(nextFilters = selectedFilters, nextBrands = selectedBrands, nextRanges = selectedRanges, nextSort = selectedSort, nextCity = citySlug) {
    window.history.pushState(null, "", buildDiscoverUrl(activeTab.key, nextCity, nextFilters, nextBrands, nextRanges, nextSort));
  }

  function resetFilters() {
    const emptyRanges = parseRangeState({});
    setSelectedFilters([]);
    setAppliedFilters([]);
    setSelectedBrands([]);
    setAppliedBrands([]);
    setSelectedRanges(emptyRanges);
    setAppliedRanges(emptyRanges);
    setSelectedSort("relevance");
    setAppliedSort("relevance");
    pushUrl([], [], emptyRanges, "relevance", citySlug);
  }

  function applyFilters() {
    setAppliedFilters(selectedFilters);
    setAppliedBrands(selectedBrands);
    setAppliedRanges(selectedRanges);
    setAppliedSort(selectedSort);
    pushUrl(selectedFilters, selectedBrands, selectedRanges, selectedSort, citySlug);
  }

  return (
    <main className="bg-slate-50">
      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Vehicle discover</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950">Find matching {activeTab.label.toLowerCase()}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Refine by brand, type, fuel, specs and budget, then open the exact model without losing your search.
              </p>
            </div>
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">City</span>
              <select
                className="rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                value={citySlug}
                onChange={(event) => {
                  const nextCity = event.target.value;
                  setCitySlug(nextCity);
                  pushUrl(selectedFilters, selectedBrands, selectedRanges, selectedSort, nextCity);
                }}
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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm lg:sticky lg:top-24">
          <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-lime-300">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter workspace
                </div>
                <h2 className="mt-3 text-xl font-black text-white">{activeTab.label}</h2>
                <p className="mt-1 text-sm text-slate-400">Choose one option per group, then apply the search.</p>
              </div>
              {selectedCount ? (
                <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">{selectedCount}</span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-200"
                onClick={applyFilters}
                type="button"
              >
                <Search className="h-4 w-4" />
                Search models
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                onClick={resetFilters}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Reset all
              </button>
            </div>

            {(selectedBrands.length || selectedFilters.length || hasRangeSelection(selectedRanges)) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedBrands.map((slug) => {
                  const brand = brandList.find((item) => item.slug === slug);
                  if (!brand) return null;
                  return (
                    <button
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/15"
                      onClick={() => setSelectedBrands((current) => current.filter((item) => item !== slug))}
                      type="button"
                      key={`brand-${slug}`}
                    >
                      {brand.name}
                    </button>
                  );
                })}
                {selectedFilters.map((slug) => {
                  const filter = activeTab.filters.find((item) => item.slug === slug);
                  if (!filter) return null;
                  return (
                    <button
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/15"
                      onClick={() => setSelectedFilters((current) => current.filter((item) => item !== slug))}
                      type="button"
                      key={`filter-${slug}`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
                {(Object.entries(selectedRanges) as [RangeKey, string][]).map(([key, value]) =>
                  value ? (
                    <button
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/15"
                      onClick={() => setSelectedRanges((current) => ({ ...current, [key]: "" }))}
                      type="button"
                      key={`range-${key}`}
                    >
                      {key.replace(/([A-Z])/g, " $1")}: {value}
                    </button>
                  ) : null,
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white">Brands</h3>
                  <p className="mt-1 text-xs text-slate-400">Search and select one or more brands.</p>
                </div>
                <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-lime-300">
                  {selectedBrands.length || brandList.length}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                <input
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500"
                  placeholder="Search brand"
                  value={brandQuery}
                  onChange={(event) => setBrandQuery(event.target.value)}
                />
              </div>
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {matchingBrands.map((brand) => {
                  const selected = selectedBrands.includes(brand.slug);
                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-lime-300 bg-lime-300/10 text-white"
                          : "border-white/10 bg-slate-900/60 text-slate-100 hover:border-white/20 hover:bg-white/5"
                      }`}
                      onClick={() =>
                        setSelectedBrands((current) =>
                          current.includes(brand.slug) ? current.filter((slug) => slug !== brand.slug) : [...current, brand.slug],
                        )
                      }
                      type="button"
                      key={brand.id}
                    >
                      <BrandLogo className="h-10 w-14 shrink-0" logoUrl={brand.logoUrl} name={brand.name} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black">{brand.name}</div>
                        <div className="text-xs text-slate-400">{selected ? "Selected" : "Tap to include"}</div>
                      </div>
                    </button>
                  );
                })}
                {!matchingBrands.length ? <div className="rounded-xl bg-slate-900/70 px-3 py-4 text-sm text-slate-400">No brand matches this search.</div> : null}
              </div>
            </div>

            {rangeSections.map((section) => (
              <RangeInputs config={section} ranges={selectedRanges} setRanges={setSelectedRanges} key={section.title} />
            ))}

            {filterGroups.map((group) => (
              <FilterGroup
                filters={group.filters}
                label={group.label}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                key={`${activeTab.key}-${group.key}`}
              />
            ))}
          </div>
        </aside>

        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Results</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {results.length} {activeTab.label.toLowerCase()} found
                </h2>
                <p className="mt-1 text-sm text-slate-500">Refine the left panel, then jump into the exact model you want.</p>
              </div>

              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort results
                </span>
                <select
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                  value={selectedSort}
                  onChange={(event) => setSelectedSort(event.target.value as SortOption)}
                >
                  {sortOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(appliedFilterObjects.length || appliedBrands.length || hasRangeSelection(appliedRanges) || appliedSort !== "relevance") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {appliedBrands.map((slug) => {
                  const brand = brandList.find((item) => item.slug === slug);
                  return brand ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" key={`applied-brand-${slug}`}>
                      {brand.name}
                    </span>
                  ) : null;
                })}
                {appliedFilterObjects.map((filter) => (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" key={filter.slug}>
                    {filter.label}
                  </span>
                ))}
                {(Object.entries(appliedRanges) as [RangeKey, string][]).map(([key, value]) =>
                  value ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" key={`applied-${key}`}>
                      {key.replace(/([A-Z])/g, " $1")}: {value}
                    </span>
                  ) : null,
                )}
                {appliedSort !== "relevance" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                    {sortOptions.find((option) => option.value === appliedSort)?.label}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {results.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((model) => {
                const variant = getPrimaryVariant(model);
                const href = variant?.slug
                  ? `/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant.slug}&city=${citySlug}`
                  : `/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&city=${citySlug}`;

                return (
                  <Link
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    href={href}
                    key={model.id}
                  >
                    <div className="aspect-[16/10] bg-slate-100">
                      <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{model.name}</h3>
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
                      <div className="mt-4 rounded-md bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">Check on-road price</div>
                    </div>
                  </Link>
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
    </main>
  );
}
