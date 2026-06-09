"use client";

import { useState } from "react";
import Link from "next/link";
import {
  filterDiscoveryModels,
  getDiscoveryTab,
  parseFilterParam,
  type DiscoveryModel,
  type DiscoveryFilter,
  type TruckFinderGroup,
} from "@/lib/services/discovery";
import type { Brand, City } from "@/types/automobile";
import { formatShortPrice } from "@/lib/utils/format";

type VehicleDiscoverClientProps = {
  models: DiscoveryModel[];
  brands: Brand[];
  cities: City[];
  initialType?: string;
  initialCity?: string;
  initialFilters?: string;
  initialBrands?: string;
};

function buildDiscoverUrl(type: string, city: string, filters: string[], brands: string[]) {
  const params = new URLSearchParams({ type, city });
  if (filters.length) params.set("filters", filters.join(","));
  if (brands.length) params.set("brands", brands.join(","));
  return `/discover?${params.toString()}`;
}

function groupedFilters(activeTab: ReturnType<typeof getDiscoveryTab>): TruckFinderGroup[] {
  if (activeTab.truckFinderGroups?.length) return activeTab.truckFinderGroups;

  const find = (slugs: string[]) => activeTab.filters.filter((filter) => slugs.includes(filter.slug));
  const used = new Set<string>();
  const groups: TruckFinderGroup[] = [
    { key: "bodyType" as const, label: "Body / type", filters: find(["suv", "hatchback", "sedan", "cruiser", "commuter", "sports", "naked-sports", "super-bikes", "scooter", "family-scooter"]) },
    { key: "fuel" as const, label: "Fuel", filters: find(["petrol", "diesel", "cng", "electric", "hybrid", "electric-cars", "electric-scooters", "electric-bikes"]) },
    { key: "tonnage" as const, label: "Budget / range", filters: find(["under-125cc", "under-250cc", "above-500cc", "above-650cc", "above-900cc", "100-km-range", "300-km-range"]) },
    { key: "application" as const, label: "Features", filters: find(["automatic", "manual", "fast-charging", "connected-tech", "dealer-offers", "route-use", "passenger-seating"]) },
  ].filter((group) => group.filters.length);

  groups.forEach((group) => group.filters.forEach((filter) => used.add(filter.slug)));
  const moreFilters = activeTab.filters.filter((filter) => !used.has(filter.slug));
  if (moreFilters.length) groups.push({ key: "truckType", label: "More filters", filters: moreFilters });
  return groups;
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

  return (
    <div className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[11px] font-black uppercase tracking-wide text-lime-300">{label}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
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
                    : [...current, filter.slug],
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
            className="rounded-full bg-white/10 px-3.5 py-2 text-sm font-black text-lime-300 hover:bg-white/15"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? "Less" : `More (${hiddenCount})`}
          </button>
        ) : null}
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
}: VehicleDiscoverClientProps) {
  const initialTab = getDiscoveryTab(initialType);
  const [type] = useState(initialTab.key);
  const [citySlug, setCitySlug] = useState(initialCity);
  const [selectedFilters, setSelectedFilters] = useState(() => parseFilterParam(initialFilters));
  const [appliedFilters, setAppliedFilters] = useState(() => parseFilterParam(initialFilters));
  const [selectedBrands, setSelectedBrands] = useState(() => parseFilterParam(initialBrands));
  const [appliedBrands, setAppliedBrands] = useState(() => parseFilterParam(initialBrands));
  const activeTab = getDiscoveryTab(type);
  const filterGroups = groupedFilters(activeTab);
  const appliedFilterObjects = activeTab.filters.filter((filter) => appliedFilters.includes(filter.slug));
  const selectedCount = selectedFilters.length + selectedBrands.length;
  const results = filterDiscoveryModels(models, activeTab, appliedFilters).filter(
    (model) => !appliedBrands.length || appliedBrands.includes(model.brand?.slug ?? ""),
  );

  function applyFilters(nextFilters = selectedFilters, nextBrands = selectedBrands, nextCity = citySlug) {
    setAppliedFilters(nextFilters);
    setAppliedBrands(nextBrands);
    window.history.pushState(null, "", buildDiscoverUrl(type, nextCity, nextFilters, nextBrands));
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
                Filters stay in the URL, so users can open models and come back to the same search.
              </p>
            </div>
            <select
              className="rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
              value={citySlug}
              onChange={(event) => {
                setCitySlug(event.target.value);
                applyFilters(selectedFilters, selectedBrands, event.target.value);
              }}
            >
              {cities.map((city) => (
                <option value={city.slug} key={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
            {activeTab.label} view all
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-lime-300">Filters</p>
              <h2 className="mt-1 text-xl font-black text-white">{activeTab.label}</h2>
            </div>
            {selectedCount ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50">
                {selectedCount}
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-5">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wide text-lime-300">Brand</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {brands.map((brand) => {
                  const selected = selectedBrands.includes(brand.slug);
                  return (
                <button
                      className={`rounded-full px-3.5 py-2 text-sm font-black transition ${
                        selected ? "bg-lime-300 text-slate-950" : "bg-white/10 text-slate-100 hover:bg-white/15"
                      }`}
                  onClick={() =>
                        setSelectedBrands((current) =>
                          current.includes(brand.slug)
                            ? current.filter((slug) => slug !== brand.slug)
                            : [...current, brand.slug],
                    )
                  }
                  type="button"
                      key={brand.id}
                >
                      {brand.name}
                </button>
                  );
                })}
              </div>
            </div>
            {filterGroups.map((group) => (
              <FilterGroup
                filters={group.filters}
                label={group.label}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                key={group.key}
              />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              className="rounded-full border border-white/15 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
              onClick={() => {
                setSelectedFilters([]);
                setAppliedFilters([]);
                setSelectedBrands([]);
                setAppliedBrands([]);
                window.history.pushState(null, "", buildDiscoverUrl(type, citySlug, [], []));
              }}
              type="button"
            >
              Reset
            </button>
            <button
              className="rounded-full bg-lime-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-200"
              onClick={() => applyFilters()}
              type="button"
            >
              Search
            </button>
          </div>
        </aside>

        <div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Results</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {results.length} {activeTab.label.toLowerCase()} found
                </h2>
              </div>
              {appliedFilterObjects.length ? (
                <div className="flex flex-wrap gap-2">
                  {appliedFilterObjects.map((filter) => (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" key={filter.slug}>
                      {filter.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((model) => {
              const variant = model.variants[0];
              return (
                <Link
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  href={`/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant?.slug}&city=${citySlug}`}
                  key={model.id}
                >
                  <div className="aspect-[16/10] bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
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
                    <div className="mt-4 rounded-md bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">
                      Check on-road price
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
