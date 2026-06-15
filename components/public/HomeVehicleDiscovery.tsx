"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/public/BrandLogo";
import { VehicleImage } from "@/components/public/VehicleImage";
import { filterDiscoveryModels, getDiscoveryTab, matchesDiscoveryFilter, modelBelongsToDiscoveryType } from "@/lib/services/discovery";
import type { Brand, City, HeroPromotion, VehicleCategory, VehicleModel, VehicleVariant } from "@/types/automobile";
import { formatShortPrice } from "@/lib/utils/format";

type HomeModel = VehicleModel & {
  brand?: Brand;
  variants: VehicleVariant[];
};

type HomeVehicleDiscoveryProps = {
  categories: VehicleCategory[];
  brands: Brand[];
  models: HomeModel[];
  cities: City[];
  heroPromotions?: HeroPromotion[];
  selectedType?: string;
};

type BrowseTab = {
  label: string;
  items: { label: string; subtitle?: string; href: string; logoUrl?: string }[];
};

function modelPriceHref(model: HomeModel, citySlug = "bangalore") {
  const params = new URLSearchParams({ model: model.slug, city: citySlug });
  const variant = model.variants.find((item) => item.isDefault) ?? model.variants[0];

  if (model.brand?.slug) params.set("brand", model.brand.slug);
  if (variant?.slug) params.set("variant", variant.slug);

  return `/on-road-price?${params.toString()}`;
}

function browseHref(href: string, citySlug = "bangalore") {
  if (!href.startsWith("/on-road-price?")) return href;

  const params = new URLSearchParams(href.split("?")[1] ?? "");
  const category = params.get("category");
  const brand = params.get("brand");
  const model = params.get("model");
  const city = params.get("city") ?? citySlug;

  if (category) {
    const filters: string[] = [];

    params.forEach((value, key) => {
      if (key === "category" || key === "city") return;
      if (key === "seats") {
        filters.push(`${value}-seater`);
        return;
      }
      if (key === "wheels") {
        filters.push(`${value}-wheeler`);
        return;
      }
      filters.push(value);
    });

    const discoverParams = new URLSearchParams({ type: category, city });
    if (filters.length) discoverParams.set("filters", filters.join(","));

    return `/discover?${discoverParams.toString()}`;
  }

  if (brand && !model) return `/brands/${brand}`;

  return href;
}

const tabs = [
  {
    key: "cars",
    label: "Cars",
    categoryIds: ["cat-car", "cat-ev"],
    evCategoryIds: ["cat-ev"],
    eyebrow: "Car discovery",
    headline: "Find cars by fuel, body type, seating and budget",
    copy: "Use category filters to narrow down cars before checking city-wise on-road price.",
    filters: [
      { label: "SUV", slug: "suv" },
      { label: "Hatchback", slug: "hatchback" },
      { label: "Sedan", slug: "sedan" },
      { label: "Automatic", slug: "automatic" },
      { label: "Manual", slug: "manual" },
      { label: "5 seater", slug: "5-seater" },
      { label: "7 seater", slug: "7-seater" },
      { label: "Diesel", slug: "diesel" },
      { label: "Petrol", slug: "petrol" },
      { label: "CNG", slug: "cng" },
      { label: "Electric", slug: "electric" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Hyundai", subtitle: "SUVs and hatchbacks", href: "/on-road-price?brand=hyundai&city=bangalore" },
          { label: "Tata", subtitle: "Safety-focused cars", href: "/on-road-price?brand=tata&city=bangalore" },
          { label: "Mahindra", subtitle: "SUVs and 7 seaters", href: "/on-road-price?brand=mahindra&city=bangalore" },
          { label: "Maruti Suzuki", subtitle: "City and family cars", href: "/on-road-price?brand=maruti-suzuki&city=bangalore" },
        ],
      },
      {
        label: "Budget",
        items: [
          { label: "Under 8 lakh", subtitle: "Entry and city cars", href: "/discover?type=cars&filters=under-8-lakh" },
          { label: "8-15 lakh", subtitle: "Popular family range", href: "/discover?type=cars&filters=8-15-lakh" },
          { label: "15-25 lakh", subtitle: "SUV and premium range", href: "/discover?type=cars&filters=15-25-lakh" },
          { label: "Above 25 lakh", subtitle: "Premium vehicles", href: "/discover?type=cars&filters=above-25-lakh" },
        ],
      },
      {
        label: "Fuel type",
        items: [
          { label: "Petrol", href: "/discover?type=cars&filters=petrol" },
          { label: "Diesel", href: "/discover?type=cars&filters=diesel" },
          { label: "CNG", href: "/discover?type=cars&filters=cng" },
          { label: "Electric", href: "/discover?type=cars&filters=electric" },
        ],
      },
      {
        label: "Body style",
        items: [
          { label: "SUV", href: "/discover?type=cars&filters=suv" },
          { label: "Hatchback", href: "/discover?type=cars&filters=hatchback" },
          { label: "Sedan", href: "/discover?type=cars&filters=sedan" },
          { label: "MUV", href: "/discover?type=cars&filters=muv" },
        ],
      },
      {
        label: "Seating",
        items: [
          { label: "5 seater", href: "/discover?type=cars&filters=5-seater" },
          { label: "6 seater", href: "/discover?type=cars&filters=6-seater" },
          { label: "7 seater", href: "/discover?type=cars&filters=7-seater" },
        ],
      },
    ],
  },
  {
    key: "bikes",
    label: "Bikes",
    categoryIds: ["cat-bike", "cat-scooter", "cat-ev"],
    evCategoryIds: ["cat-ev"],
    eyebrow: "Bike discovery",
    headline: "Find bikes by type, engine, mileage and EV range",
    copy: "Compare commuter bikes, cruisers, scooters and electric two-wheelers with practical buying filters.",
    filters: [
      { label: "Cruiser", slug: "cruiser" },
      { label: "Commuter", slug: "commuter" },
      { label: "Sports", slug: "sports" },
      { label: "Naked sports", slug: "naked-sports" },
      { label: "Scooter", slug: "scooter" },
      { label: "Under 125cc", slug: "under-125cc" },
      { label: "Under 250cc", slug: "under-250cc" },
      { label: "200cc+", slug: "200cc-plus" },
      { label: "Above 500cc", slug: "above-500cc" },
      { label: "Above 650cc", slug: "above-650cc" },
      { label: "Above 900cc", slug: "above-900cc" },
      { label: "Super bikes", slug: "super-bikes" },
      { label: "ABS", slug: "abs" },
      { label: "High mileage", slug: "high-mileage" },
      { label: "Electric", slug: "electric" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Royal Enfield", subtitle: "Cruiser and retro bikes", href: "/on-road-price?brand=royal-enfield&city=bangalore" },
          { label: "TVS", subtitle: "Commuter and sport bikes", href: "/on-road-price?brand=tvs&city=bangalore" },
          { label: "Bajaj", subtitle: "Street and commuter", href: "/on-road-price?brand=bajaj&city=bangalore" },
          { label: "Honda", subtitle: "Commuter and scooters", href: "/on-road-price?brand=honda&city=bangalore" },
          { label: "Yamaha", subtitle: "Sporty commuters", href: "/on-road-price?brand=yamaha&city=bangalore" },
          { label: "Ather", subtitle: "Electric scooters", href: "/on-road-price?brand=ather&city=bangalore" },
        ],
      },
      {
        label: "Budget",
        items: [
          { label: "Under 1 lakh", href: "/discover?type=bikes&filters=under-1-lakh" },
          { label: "1-2 lakh", href: "/discover?type=bikes&filters=1-2-lakh" },
          { label: "2-5 lakh", href: "/discover?type=bikes&filters=2-5-lakh" },
          { label: "Above 5 lakh", href: "/discover?type=bikes&filters=above-5-lakh" },
        ],
      },
      {
        label: "Displacement",
        items: [
          { label: "Under 125cc", href: "/discover?type=bikes&filters=under-125cc" },
          { label: "125-250cc", href: "/discover?type=bikes&filters=under-250cc" },
          { label: "250-500cc", href: "/discover?type=bikes&filters=200cc-plus" },
          { label: "Above 500cc", href: "/discover?type=bikes&filters=above-500cc" },
          { label: "Above 650cc", href: "/discover?type=bikes&filters=above-650cc" },
          { label: "Above 900cc", href: "/discover?type=bikes&filters=above-900cc" },
        ],
      },
      {
        label: "Body style",
        items: [
          { label: "Commuter", href: "/discover?type=bikes&filters=commuter" },
          { label: "Cruiser", href: "/discover?type=bikes&filters=cruiser" },
          { label: "Sports", href: "/discover?type=bikes&filters=sports" },
          { label: "Naked sports", href: "/discover?type=bikes&filters=naked-sports" },
          { label: "Scooter", href: "/discover?type=bikes&filters=scooter" },
          { label: "Super bikes", href: "/discover?type=bikes&filters=super-bikes" },
        ],
      },
      {
        label: "EV",
        items: [
          { label: "Electric scooters", href: "/discover?type=bikes&filters=electric-scooters" },
          { label: "Fast charging", href: "/discover?type=bikes&filters=fast-charging" },
          { label: "100 km+ range", href: "/discover?type=bikes&filters=100-km-range" },
        ],
      },
    ],
  },
  {
    key: "scooters",
    label: "Scooters",
    categoryIds: ["cat-scooter", "cat-ev"],
    evCategoryIds: ["cat-ev"],
    eyebrow: "Scooter discovery",
    headline: "Find scooters by range, comfort, charging and city price",
    copy: "Compare petrol and electric scooters with practical city buying filters.",
    filters: [
      { label: "Electric", slug: "electric" },
      { label: "Petrol", slug: "petrol" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "100 km+ range", slug: "100-km-range" },
      { label: "Family scooter", slug: "family-scooter" },
      { label: "Connected tech", slug: "connected-tech" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Ather", subtitle: "Electric scooters", href: "/brands/ather" },
          { label: "Honda", subtitle: "Petrol scooters", href: "/brands/honda" },
          { label: "TVS", subtitle: "ICE and EV scooters", href: "/brands/tvs" },
        ],
      },
      {
        label: "Budget",
        items: [
          { label: "Under 1 lakh", href: "/discover?type=scooters&filters=under-1-lakh" },
          { label: "1-1.5 lakh", href: "/discover?type=scooters&filters=1-1-5-lakh" },
          { label: "Above 1.5 lakh", href: "/discover?type=scooters&filters=above-1-5-lakh" },
        ],
      },
      {
        label: "Fuel type",
        items: [
          { label: "Electric", href: "/discover?type=scooters&filters=electric" },
          { label: "Petrol", href: "/discover?type=scooters&filters=petrol" },
        ],
      },
    ],
  },
  {
    key: "ev",
    label: "EV Vehicles",
    categoryIds: ["cat-ev", "cat-car", "cat-bike", "cat-scooter"],
    evCategoryIds: ["cat-ev"],
    eyebrow: "EV discovery",
    headline: "Find electric cars, bikes and scooters by range and charging",
    copy: "Explore EV models across personal mobility categories with range, battery and city price context.",
    filters: [
      { label: "Electric cars", slug: "electric-cars" },
      { label: "Electric scooters", slug: "electric-scooters" },
      { label: "Electric bikes", slug: "electric-bikes" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "100 km+ range", slug: "100-km-range" },
      { label: "300 km+ range", slug: "300-km-range" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Ather", subtitle: "Electric scooters", href: "/brands/ather" },
          { label: "Tata", subtitle: "Electric cars", href: "/brands/tata" },
          { label: "Mahindra", subtitle: "Electric SUVs", href: "/brands/mahindra" },
        ],
      },
      {
        label: "Range",
        items: [
          { label: "Under 100 km", href: "/discover?type=ev&filters=under-100-km" },
          { label: "100-250 km", href: "/discover?type=ev&filters=100-250-km" },
          { label: "250 km+", href: "/discover?type=ev&filters=250-km-plus" },
        ],
      },
      {
        label: "Body style",
        items: [
          { label: "Scooter", href: "/discover?type=ev&filters=scooter" },
          { label: "Car", href: "/discover?type=ev&filters=car" },
          { label: "Bike", href: "/discover?type=ev&filters=bike" },
        ],
      },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    categoryIds: ["cat-commercial", "cat-ev-commercial"],
    evCategoryIds: ["cat-ev-commercial"],
    eyebrow: "Commercial discovery",
    headline: "Find business vehicles by wheels, payload, body and fuel",
    copy: "Use fleet-ready filters for pickups, cargo vehicles, trucks and EV commercial options.",
    filters: [
      { label: "Small", slug: "small-loader" },
      { label: "Medium", slug: "medium-loader" },
      { label: "Large", slug: "large-loader" },
      { label: "Pickup", slug: "pickup" },
      { label: "Mini truck", slug: "mini-truck" },
      { label: "Trucks", slug: "trucks" },
      { label: "Light commercial", slug: "light-commercial" },
      { label: "Cargo", slug: "cargo" },
      { label: "3 wheeler", slug: "3-wheeler" },
      { label: "4 wheeler", slug: "4-wheeler" },
      { label: "6 wheeler", slug: "6-wheeler" },
      { label: "Payload", slug: "payload" },
      { label: "Diesel", slug: "diesel" },
      { label: "CNG", slug: "cng" },
      { label: "Electric", slug: "electric" },
      { label: "Fleet use", slug: "fleet-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Ashok Leyland", subtitle: "LCV and trucks", href: "/on-road-price?brand=ashok-leyland&city=bangalore" },
          { label: "Euler Motors", subtitle: "EV cargo vehicles", href: "/on-road-price?brand=euler-motors&city=bangalore" },
          { label: "Tata", subtitle: "Commercial lineup", href: "/on-road-price?brand=tata&city=bangalore" },
          { label: "Mahindra", subtitle: "Pickup and cargo", href: "/on-road-price?brand=mahindra&city=bangalore" },
        ],
      },
      {
        label: "Budget",
        items: [
          { label: "Under 5 lakh", href: "/discover?type=commercial&filters=under-5-lakh" },
          { label: "5-10 lakh", href: "/discover?type=commercial&filters=5-10-lakh" },
          { label: "10-20 lakh", href: "/discover?type=commercial&filters=10-20-lakh" },
          { label: "Above 20 lakh", href: "/discover?type=commercial&filters=above-20-lakh" },
        ],
      },
      {
        label: "Fuel type",
        items: [
          { label: "Diesel", href: "/discover?type=commercial&filters=diesel" },
          { label: "CNG", href: "/discover?type=commercial&filters=cng" },
          { label: "Electric", href: "/discover?type=commercial&filters=electric" },
        ],
      },
      {
        label: "Wheels",
        items: [
          { label: "3 wheeler", href: "/discover?type=commercial&filters=3-wheeler" },
          { label: "4 wheeler", href: "/discover?type=commercial&filters=4-wheeler" },
          { label: "6 wheeler", href: "/discover?type=commercial&filters=6-wheeler" },
          { label: "10 wheeler", href: "/discover?type=commercial&filters=10-wheeler" },
        ],
      },
      {
        label: "Payload",
        items: [
          { label: "Under 1 ton", href: "/discover?type=commercial&filters=under-1-ton" },
          { label: "1-2 ton", href: "/discover?type=commercial&filters=1-2-ton" },
          { label: "2 ton+", href: "/discover?type=commercial&filters=2-ton-plus" },
        ],
      },
    ],
  },
  {
    key: "ev-commercial",
    label: "EV Commercial",
    categoryIds: ["cat-ev-commercial", "cat-commercial"],
    evCategoryIds: ["cat-ev-commercial"],
    eyebrow: "EV commercial discovery",
    headline: "Find electric commercial vehicles by payload, range and business use",
    copy: "Compare electric cargo and fleet vehicles with charging, payload and running-cost context.",
    filters: [
      { label: "Small", slug: "small-loader" },
      { label: "Medium", slug: "medium-loader" },
      { label: "Large", slug: "large-loader" },
      { label: "Pickup", slug: "pickup" },
      { label: "Mini truck", slug: "mini-truck" },
      { label: "Trucks", slug: "trucks" },
      { label: "Electric", slug: "electric" },
      { label: "Cargo", slug: "cargo" },
      { label: "3 wheeler", slug: "3-wheeler" },
      { label: "4 wheeler", slug: "4-wheeler" },
      { label: "Payload", slug: "payload" },
      { label: "Fleet use", slug: "fleet-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Euler Motors", subtitle: "EV cargo vehicles", href: "/brands/euler-motors" },
          { label: "Tata Commercial", subtitle: "EV and ICE commercial", href: "/brands/tata-commercial" },
        ],
      },
      {
        label: "Payload",
        items: [
          { label: "Under 1 ton", href: "/discover?type=ev-commercial&filters=under-1-ton" },
          { label: "1-2 ton", href: "/discover?type=ev-commercial&filters=1-2-ton" },
          { label: "2 ton+", href: "/discover?type=ev-commercial&filters=2-ton-plus" },
        ],
      },
    ],
  },
  {
    key: "passenger-ev",
    label: "Passenger EV",
    categoryIds: ["cat-passenger-ev"],
    evCategoryIds: ["cat-passenger-ev"],
    eyebrow: "Passenger EV discovery",
    headline: "Find e-rickshaws and e-autos by range, seating and route use",
    copy: "Compare passenger electric vehicles for daily route, city permits and running cost.",
    filters: [
      { label: "E-rickshaw", slug: "e-rickshaw" },
      { label: "E-auto", slug: "e-auto" },
      { label: "Passenger seating", slug: "passenger-seating" },
      { label: "Fast charging", slug: "fast-charging" },
      { label: "Route use", slug: "route-use" },
      { label: "Dealer offers", slug: "dealer-offers" },
    ],
    browseTabs: [
      {
        label: "Brand",
        items: [
          { label: "Mahindra", subtitle: "Passenger EV mobility", href: "/brands/mahindra" },
          { label: "Euler Motors", subtitle: "Electric mobility", href: "/brands/euler-motors" },
        ],
      },
      {
        label: "Use case",
        items: [
          { label: "City passenger", href: "/discover?type=passenger-ev&filters=city-passenger" },
          { label: "Shared mobility", href: "/discover?type=passenger-ev&filters=shared-mobility" },
          { label: "Route permit", href: "/discover?type=passenger-ev&filters=route-permit" },
        ],
      },
    ],
  },
];

const evCategorySlugMap: Record<string, string[]> = {
  cars: ["ev-vehicles"],
  bikes: ["ev-vehicles"],
  scooters: ["ev-vehicles"],
  ev: ["ev-vehicles"],
  commercial: ["ev-commercial-vehicles"],
  "ev-commercial": ["ev-commercial-vehicles"],
  "passenger-ev": ["passenger-ev-vehicles"],
};

function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SearchableQuickFilters({
  activeTab,
  citySlug,
  models,
  categories,
}: {
  activeTab: (typeof tabs)[number];
  citySlug: string;
  models: HomeModel[];
  categories: VehicleCategory[];
}) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const discoveryTab = getDiscoveryTab(activeTab.key);

  useEffect(() => {
    setSelectedFilters([]);
  }, [activeTab.key]);

  const filteredModels = useMemo(() => {
    if (!selectedFilters.length) return models.slice(0, 8);
    return filterDiscoveryModels(models, discoveryTab, selectedFilters, "any").slice(0, 8);
  }, [discoveryTab, models, selectedFilters]);

  const searchParams = new URLSearchParams({ type: activeTab.key, city: citySlug });
  if (selectedFilters.length) searchParams.set("filters", selectedFilters.join(","));
  const searchHref = `/discover?${searchParams.toString()}`;

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Quick filters</p>
            {selectedFilters.length ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{selectedFilters.length} selected</span>
            ) : null}
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Refine by what matters</h3>
          <p className="mt-1 text-sm text-slate-600">Pick a filter and the matching models appear right here.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedFilters.length ? (
            <button
              className="rounded-full border border-slate-200 px-3.5 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              onClick={() => setSelectedFilters([])}
              type="button"
            >
              Reset
            </button>
          ) : null}
          <Link className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800" href={searchHref}>
            View all
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {activeTab.filters.map((filter) => {
            const selected = selectedFilters.includes(filter.slug);
            return (
              <button
                className={`rounded-full border px-3.5 py-2 text-sm font-black transition ${
                  selected
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
                onClick={() =>
                  setSelectedFilters((current) => {
                    if (current.includes(filter.slug)) {
                      return [];
                    }

                    return [filter.slug];
                  })
                }
                type="button"
                key={filter.slug}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" />
            <div
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
              ref={scrollerRef}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {filteredModels.length ? (
                filteredModels.map((model) => {
                  const variant = model.variants[0];
                  const category = categories.find((item) => item.id === model.categoryId);
                  const launchLabel = model.launchLabel?.trim();
                  return (
                    <a
                      className="group min-w-[260px] max-w-[260px] snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      href={`/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant?.slug}&city=${citySlug}`}
                      key={model.id}
                    >
                      <div className="relative aspect-[16/10] bg-slate-100">
                        <VehicleImage className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={model.imageUrl} alt={model.name} />
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-800">{category?.name}</span>
                        {launchLabel ? (
                          <span className="absolute right-3 top-3 rounded-full bg-lime-300 px-3 py-1 text-[11px] font-black text-slate-950">{launchLabel}</span>
                        ) : null}
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                        <h4 className="mt-1 text-lg font-black text-slate-950">{model.name}</h4>
                        <p className="mt-2 text-sm text-slate-600">
                          {model.bodyType} {variant ? `from ${formatShortPrice(variant.exShowroomPrice)} ex-showroom` : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {variant ? (
                            <>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{variant.fuelType}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{variant.transmission}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-600">
                  No matching models for this selection right now.
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50" onClick={() => scrollerRef.current?.scrollBy({ left: -320, behavior: "smooth" })} type="button" aria-label="Scroll left">
              ←
            </button>
            <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50" onClick={() => scrollerRef.current?.scrollBy({ left: 320, behavior: "smooth" })} type="button" aria-label="Scroll right">
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseByTabs({ citySlug, title, typeKey, tabs }: { citySlug: string; title: string; typeKey: string; tabs: BrowseTab[] }) {
  const [activeTabLabel, setActiveTabLabel] = useState(tabs[0]?.label ?? "");
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const activeTab = tabs.find((tab) => tab.label === activeTabLabel) ?? tabs[0];
  const isBrandTab = activeTab.label === "Brand";
  const previewCount = 10;
  const visibleItems = activeTab.items.slice(0, previewCount);
  const viewAllHref = `/discover?type=${typeKey}&city=${citySlug}`;
  const hiddenCount = Math.max(activeTab.items.length - visibleItems.length, 0);

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 p-5 text-white">
        <p className="text-xs font-black uppercase tracking-wide text-lime-300">Smart quick filters</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black">Browse {title} By</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-50">
              Jump by brand, price, engine and riding style without opening a heavy filter panel.
            </p>
          </div>
          <span className="rounded-full bg-lime-300 px-4 py-2 text-xs font-black uppercase text-slate-950">
            Fast discovery
          </span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-5 pt-4 text-sm font-black text-slate-700">
        {tabs.map((tab) => (
          <button
            className={`shrink-0 rounded-t-lg border-b-4 px-4 py-3 transition ${
              activeTab.label === tab.label
                ? "border-lime-400 bg-white text-emerald-800"
                : "border-transparent bg-slate-100 text-slate-600 hover:text-emerald-700"
            }`}
            onClick={() => {
              setActiveTabLabel(tab.label);
              setIsBrandModalOpen(false);
            }}
            type="button"
            key={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {visibleItems.map((item) => (
              <a
                className="group grid min-h-36 place-items-center border-b border-r border-slate-200 p-4 text-center transition hover:bg-emerald-50"
                href={browseHref(item.href, citySlug)}
                key={item.label}
              >
                <div>
                  <div className="mb-3 grid h-16 place-items-center">
                    <BrandLogo className="mx-auto h-14 w-28" name={item.label} logoUrl={item.logoUrl} />
                  </div>
                  <div className="text-base font-black leading-tight text-slate-950">{item.label}</div>
                  {item.subtitle ? (
                    <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.subtitle}</div>
                  ) : null}
                  <div className="mt-2 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100">
                    View models
                  </div>
                </div>
              </a>
            ))}
          </div>
          {isBrandTab ? (
            activeTab.items.length > previewCount ? (
              <button
                className="block w-full bg-slate-50 px-5 py-4 text-center text-sm font-black text-emerald-700 hover:bg-emerald-50"
                onClick={() => setIsBrandModalOpen(true)}
                type="button"
              >
                See more brands ({hiddenCount} more)
              </button>
            ) : null
          ) : (
            <a
              className="block bg-slate-50 px-5 py-4 text-center text-sm font-black text-emerald-700 hover:bg-emerald-50"
              href={viewAllHref}
            >
              View all
            </a>
          )}
        </div>
      </div>

      {isBrandModalOpen && isBrandTab ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" onClick={() => setIsBrandModalOpen(false)}>
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-700">Smart quick filters</p>
                <h4 className="mt-1 text-2xl font-black text-slate-950">All {title.toLowerCase()} brands</h4>
              </div>
              <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" onClick={() => setIsBrandModalOpen(false)} type="button" aria-label="Close brands list">
                ×
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Browse every brand in this section and jump to the relevant price or discovery page.
            </p>

            <div className="mt-6 grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {activeTab.items.map((item) => (
                <a
                  className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:bg-white"
                  href={browseHref(item.href, citySlug)}
                  key={item.label}
                  onClick={() => setIsBrandModalOpen(false)}
                >
                  <div className="mb-3 grid h-16 place-items-center">
                    <BrandLogo className="mx-auto h-14 w-28" name={item.label} logoUrl={item.logoUrl} />
                  </div>
                  <div className="text-base font-black leading-tight text-slate-950">{item.label}</div>
                  {item.subtitle ? (
                    <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.subtitle}</div>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CommercialTruckFinder({
  activeType,
  citySlug,
  models,
}: {
  activeType: string;
  citySlug: string;
  models: HomeModel[];
}) {
  const tab = getDiscoveryTab(activeType);
  const groups = tab.truckFinderGroups ?? [];
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  if (!groups.length) return null;

  const filterSlugs = Object.values(selectedFilters).filter(Boolean);
  const matchedModels = filterDiscoveryModels(models, tab, filterSlugs);
  const searchParams = new URLSearchParams({ type: tab.key, city: citySlug });
  if (filterSlugs.length) searchParams.set("filters", filterSlugs.join(","));

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-lime-300">Work-based finder</p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">Find the right commercial vehicle for your work</h3>
          <p className="mt-3 text-sm leading-6 text-emerald-50">
            Choose the job, load, body and fuel. We will show suitable trucks from the same live model data.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-white/10 p-3">
              <div className="text-xl font-black text-lime-300">{matchedModels.length}</div>
              <div className="text-[11px] font-bold text-emerald-50">matches</div>
            </div>
            <div className="rounded-md bg-white/10 p-3">
              <div className="text-xl font-black text-lime-300">{groups.length}</div>
              <div className="text-[11px] font-bold text-emerald-50">filters</div>
            </div>
            <div className="rounded-md bg-white/10 p-3">
              <div className="text-xl font-black text-lime-300">API</div>
              <div className="text-[11px] font-bold text-emerald-50">ready</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <label className="grid gap-1" key={group.key}>
                <span className="text-[11px] font-black uppercase tracking-wide text-lime-300">{group.label}</span>
                <select
                  className="min-h-12 rounded-md border border-white/15 bg-white/10 px-3 text-sm font-black text-white outline-none focus:border-lime-300"
                  value={selectedFilters[group.key] ?? ""}
                  onChange={(event) =>
                    setSelectedFilters((current) => ({
                      ...current,
                      [group.key]: event.target.value,
                    }))
                  }
                >
                  <option className="text-slate-950" value="">Any {group.label.toLowerCase()}</option>
                  {group.filters.map((filter) => (
                    <option className="text-slate-950" value={filter.slug} key={filter.slug}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2">
              {filterSlugs.length ? (
                filterSlugs.map((slug) => (
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950" key={slug}>
                    {slug.replaceAll("-", " ")}
                  </span>
                ))
              ) : (
                <span className="text-sm font-bold text-emerald-50">Select one or more needs to narrow the list.</span>
              )}
            </div>
            <div className="flex gap-2">
              {filterSlugs.length ? (
                <button
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white hover:bg-white/10"
                  onClick={() => setSelectedFilters({})}
                  type="button"
                >
                  Reset
                </button>
              ) : null}
              <Link
                className="rounded-full bg-lime-300 px-5 py-2 text-sm font-black text-slate-950 hover:bg-lime-200"
                href={`/discover?${searchParams.toString()}`}
              >
                Find suitable trucks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeVehicleDiscovery({
  categories,
  brands,
  models,
  cities,
  heroPromotions = [],
  selectedType = "cars",
}: HomeVehicleDiscoveryProps) {
  const activeTab = tabs.find((tab) => tab.key === selectedType) ?? tabs[0];
  const activeDiscoveryTab = getDiscoveryTab(activeTab.key);
  const activeEvCategoryIds = categories
    .filter((category) => evCategorySlugMap[activeTab.key]?.includes(category.slug) || activeTab.evCategoryIds.includes(category.id))
    .map((category) => category.id);
  const typeModels = models;
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? "bangalore");
  const [activeCarouselTab, setActiveCarouselTab] = useState("all");
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setActiveCarouselTab("all");
  }, [activeTab.key]);
  useEffect(() => {
    carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [activeCarouselTab]);
  const carouselTabs = useMemo<Array<{ key: string; label: string; filter: (model: HomeModel) => boolean }>>(() => {
    const nextTabs: Array<{ key: string; label: string; filter: (model: HomeModel) => boolean }> = [{ key: "all", label: "All", filter: () => true }];

    if (typeModels.some((model) => Boolean(model.launchLabel?.trim()))) {
      nextTabs.push({ key: "new-launch", label: "New launch", filter: (model) => Boolean(model.launchLabel?.trim()) });
    }

    const bodyTypes = Array.from(new Set(typeModels.map((model) => model.bodyType.trim()).filter(Boolean))).slice(0, 3);
    bodyTypes.forEach((bodyType) => {
      nextTabs.push({
        key: slugifyValue(bodyType),
        label: bodyType,
        filter: (model) => model.bodyType === bodyType,
      });
    });

    return nextTabs;
  }, [typeModels]);
  const activeCarouselTabConfig = carouselTabs.find((tab) => tab.key === activeCarouselTab) ?? carouselTabs[0];
  const filteredCarouselModels = useMemo(() => typeModels.filter(activeCarouselTabConfig.filter).slice(0, 8), [activeCarouselTabConfig, typeModels]);
  const discoverHref = `/discover?type=${activeTab.key}&city=${citySlug}`;
  const scrollCarousel = (direction: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  };
  const evModels = useMemo(
    () =>
      typeModels
        .filter(
          (model) =>
            modelBelongsToDiscoveryType(model, activeDiscoveryTab) &&
            (activeEvCategoryIds.includes(model.categoryId) ||
              model.variants.some((variant) => variant.active && variant.fuelType === "Electric")),
        )
        .slice(0, 4),
    [activeDiscoveryTab, activeEvCategoryIds, typeModels],
  );
  const browseTabs = useMemo(() => {
    const brandItems = brands
      .filter((brand) => brand.active)
      .sort((left, right) => Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name))
      .map((brand) => ({
        label: brand.name,
        subtitle: "Models and prices",
        href: `/brands/${brand.slug}`,
        logoUrl: brand.logoUrl,
      }));

    return activeTab.browseTabs.map((tab) => (tab.label === "Brand" && brandItems.length ? { ...tab, items: brandItems } : tab));
  }, [activeTab, brands]);
  const activeBanner = heroPromotions.find(
    (promotion) =>
      promotion.active &&
      promotion.categoryKey === activeTab.key &&
      (promotion.placement ?? "homepage_hero") === "mini_home_banner",
  );

  return (
    <section className="border-b border-emerald-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-700">{activeBanner?.eyebrow || activeTab.eyebrow}</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">{activeBanner?.title || activeTab.headline}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeBanner?.subtitle || activeTab.copy}</p>
          </div>
          <select
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-slate-800"
            value={citySlug}
            onChange={(event) => setCitySlug(event.target.value)}
          >
            {cities.map((city) => (
              <option value={city.slug} key={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        {activeBanner?.imageUrl ? (
          <a
            className="group overflow-hidden rounded-lg border border-emerald-100 bg-slate-950 shadow-sm"
            href={activeBanner.targetUrl}
          >
            <div className="relative aspect-[16/10]">
              <VehicleImage className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={activeBanner.imageUrl} alt={activeBanner.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-xs font-bold uppercase tracking-wide text-lime-300">{activeBanner.eyebrow || "Mini homepage banner"}</div>
                <div className="mt-1 text-lg font-black leading-tight">{activeBanner.title}</div>
                {activeBanner.ctaLabel ? (
                  <span className="mt-3 inline-flex rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                    {activeBanner.ctaLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </a>
        ) : null}
      </div>

      <SearchableQuickFilters activeTab={activeTab} citySlug={citySlug} models={typeModels} categories={categories} key={activeTab.key} />

      <CommercialTruckFinder activeType={activeTab.key} citySlug={citySlug} models={typeModels} />

      <BrowseByTabs citySlug={citySlug} title={activeTab.label} typeKey={activeTab.key} tabs={browseTabs} />

      {evModels.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-lime-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-64 bg-slate-950">
              <VehicleImage className="h-full w-full object-cover opacity-75" src={evModels[0].imageUrl} alt={evModels[0].name} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-300">EV subsection</p>
                <h3 className="mt-1 text-2xl font-black">Electric options in {activeTab.label}</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-50">
                  EV choices stay inside the selected category with range, battery, running cost and city benefit context.
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Low running cost</p>
              <h4 className="text-xl font-black text-slate-950">EV picks for this category</h4>
            </div>
            <a className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white" href={`/discover?type=${activeTab.key}&city=${citySlug}&filters=electric`}>
              View all
            </a>
          </div>
          <div id={`ev-${activeTab.key}`} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {evModels.map((model) => {
              const variant = model.variants[0];
              return (
                <a className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50 shadow-sm" href={`/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant?.slug}&city=${citySlug}`} key={model.id}>
                  <div className="aspect-[4/3] bg-slate-200">
                    <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                    <div className="mt-1 font-black text-slate-950">{model.name}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-md bg-white p-2 font-bold text-slate-700">Range: {variant?.mileage ?? "NA"}</span>
                      <span className="rounded-md bg-white p-2 font-bold text-slate-700">Battery: {variant?.engineCapacity ?? "NA"}</span>
                      <span className="rounded-md bg-white p-2 font-bold text-slate-700">Fuel: {variant?.fuelType ?? "EV"}</span>
                      <span className="rounded-md bg-lime-100 p-2 font-black text-lime-900">{variant ? formatShortPrice(variant.exShowroomPrice) : "Price soon"}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">Models</p>
          <h3 className="text-2xl font-black text-slate-950">{activeTab.label} models</h3>
        </div>
        <a className="text-sm font-black text-emerald-700" href={discoverHref}>
          See all
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {carouselTabs.map((tab) => {
          const selected = activeCarouselTabConfig.key === tab.key;
          return (
            <button
              className={`rounded-full border px-3.5 py-2 text-sm font-black transition ${selected ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"}`}
              onClick={() => setActiveCarouselTab(tab.key)}
              type="button"
              key={tab.key}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent" />
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth" ref={carouselRef} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {filteredCarouselModels.length ? (
              filteredCarouselModels.map((model) => {
                const variant = model.variants[0];
                const category = categories.find((item) => item.id === model.categoryId);
                const launchLabel = model.launchLabel?.trim();
                return (
                  <a
                    className="group min-w-[260px] max-w-[260px] snap-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    href={`/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant?.slug}&city=${citySlug}`}
                    key={model.id}
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      <VehicleImage className="h-full w-full object-cover transition duration-500 group-hover:scale-105" src={model.imageUrl} alt={model.name} />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-800">
                        {category?.name}
                      </span>
                      {launchLabel ? (
                        <span className="absolute right-3 top-3 rounded-full bg-lime-300 px-3 py-1 text-[11px] font-black text-slate-950">
                          {launchLabel}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{model.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {model.bodyType} {variant ? `from ${formatShortPrice(variant.exShowroomPrice)} ex-showroom` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {model.loaderSize ? (
                          <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-900">{model.loaderSize} loader</span>
                        ) : null}
                        {variant ? (
                          <>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{variant.fuelType}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{variant.transmission}</span>
                            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-bold text-lime-900">{variant.mileage}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </a>
                );
              })
            ) : (
              <div className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-600">
                No {activeCarouselTabConfig.label.toLowerCase()} models are available right now.
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50" onClick={() => scrollCarousel("left")} type="button" aria-label="Scroll left">
            ←
          </button>
          <button className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50" onClick={() => scrollCarousel("right")} type="button" aria-label="Scroll right">
            →
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}

export function HomepageCategorySections({ models }: Pick<HomeVehicleDiscoveryProps, "models">) {
  const sections = [
    { title: "EV Cars", ids: ["cat-ev"], copy: "Electric vehicles with range, charging and city pricing context." },
    { title: "EV Bikes and Scooters", ids: ["cat-ev", "cat-scooter"], copy: "Electric two-wheelers for lower running cost and connected city rides." },
    { title: "Commercial Vehicles", ids: ["cat-commercial"], copy: "Business vehicles with payload, permit and on-road cost awareness." },
    { title: "EV Commercial Vehicles", ids: ["cat-ev-commercial"], copy: "Electric cargo and fleet options for last-mile operations." },
  ];

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-bold text-emerald-700">Explore by use case</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">Vehicle sections for every buyer journey</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sections.map((section) => {
            const sectionModels = models.filter((model) => section.ids.includes(model.categoryId));
            return (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={section.title}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{section.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{section.copy}</p>
                  </div>
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                    {sectionModels.length}
                  </span>
                </div>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {sectionModels.map((model) => (
                    <a className="w-44 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm" href={modelPriceHref(model)} key={model.id}>
                      <div className="aspect-[4/3] bg-slate-100">
                        <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                        <div className="font-black text-slate-950">{model.name}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomepageQuickFilterSections({
  models,
  selectedType = "cars",
}: {
  models: HomeModel[];
  selectedType?: string;
}) {
  const activeTab = tabs.find((tab) => tab.key === selectedType) ?? tabs[0];
  const discoveryTab = getDiscoveryTab(selectedType);
  const typeModels = models;
  const sections = activeTab.filters.slice(0, 6).map((filter) => {
    const sharedFilter = discoveryTab.filters.find((item) => item.slug === filter.slug) ?? filter;
    const filteredModels = filterDiscoveryModels(
      typeModels,
      discoveryTab,
      [sharedFilter.slug],
    ).filter((model) => matchesDiscoveryFilter(model, sharedFilter));

    return {
      ...filter,
      models: filteredModels.slice(0, 3),
      total: filteredModels.length,
    };
  }).filter((section) => section.models.length);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-emerald-700">More ways to explore</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950">{activeTab.label} quick filter sections</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            These are extra discovery sections for users who browse by need before choosing a model.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-5">
        {sections.map((section) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={section.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Quick filter</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{section.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{section.total} model{section.total === 1 ? "" : "s"} available</p>
              </div>
              <a
                className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
                href={`/discover?type=${activeTab.key}&city=bangalore&filters=${section.slug}`}
              >
                View all
              </a>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {section.models.map((model) => {
                const variant = model.variants[0];
                const spec = variant?.specifications;
                return (
                  <a
                    className="overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md"
                    href={`/on-road-price?brand=${model.brand?.slug}&model=${model.slug}&variant=${variant?.slug}&city=bangalore`}
                    key={`${section.slug}-${model.id}`}
                  >
                    <div className="aspect-[4/3] bg-slate-100">
                      <VehicleImage className="h-full w-full object-cover" src={model.imageUrl} alt={model.name} />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-emerald-700">{model.brand?.name}</div>
                          <div className="mt-1 font-black text-slate-950">{model.name}</div>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-emerald-800">
                          {variant?.fuelType ?? "Info"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-600">{model.bodyType}</div>
                      {model.loaderSize ? (
                        <div className="mt-2 inline-flex rounded-full bg-lime-100 px-2.5 py-1 text-[11px] font-black uppercase text-lime-900">
                          {model.loaderSize} loader
                        </div>
                      ) : null}
                      {variant ? (
                        <div className="mt-3 space-y-2">
                          <div className="rounded-md bg-lime-100 px-2 py-1 text-xs font-black text-lime-900">
                            Starts {formatShortPrice(variant.exShowroomPrice)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                            <span className="rounded-md bg-white px-2 py-1">Engine: {variant.engineCapacity}</span>
                            <span className="rounded-md bg-white px-2 py-1">Mileage: {variant.mileage}</span>
                            <span className="rounded-md bg-white px-2 py-1">{variant.transmission}</span>
                            <span className="rounded-md bg-white px-2 py-1">{variant.seatingCapacity} seats</span>
                          </div>
                          {spec?.highlights.length ? (
                            <p className="line-clamp-2 text-xs leading-5 text-slate-600">{spec.highlights.slice(0, 2).join(" - ")}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-1">
                            {spec?.features.slice(0, 3).map((feature) => (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800" key={feature}>
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-3 rounded-md bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">
                        Check on-road price
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
