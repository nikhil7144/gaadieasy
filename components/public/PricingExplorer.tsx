"use client";

import { useMemo, useState } from "react";
import type { Brand, City, VehicleModel, VehicleVariant } from "@/types/automobile";
import { formatShortPrice } from "@/lib/utils/format";

export function PricingExplorer({
  brands,
  cities,
  models,
  variants,
  categoryIds,
  initialBrandId,
  initialModelId,
  initialCitySlug,
}: {
  brands: Brand[];
  cities: City[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  categoryIds?: string[];
  initialBrandId?: string;
  initialModelId?: string;
  initialCitySlug?: string;
}) {
  const filteredModels = useMemo(
    () => models.filter((model) => !categoryIds?.length || categoryIds.includes(model.categoryId)),
    [categoryIds, models],
  );
  const filteredBrands = useMemo(() => {
    const allowedBrandIds = new Set(filteredModels.map((model) => model.brandId));
    return brands.filter((brand) => allowedBrandIds.has(brand.id));
  }, [brands, filteredModels]);
  const [brandChoice, setBrandChoice] = useState(initialBrandId ?? "");
  const activeBrandId =
    filteredBrands.find((brand) => brand.id === brandChoice)?.id ??
    filteredBrands.find((brand) => brand.id === initialBrandId)?.id ??
    filteredBrands[0]?.id ??
    "";
  const brandModels = useMemo(
    () => filteredModels.filter((model) => model.brandId === activeBrandId),
    [activeBrandId, filteredModels],
  );
  const [modelChoice, setModelChoice] = useState(initialModelId ?? "");
  const activeModelId =
    brandModels.find((model) => model.id === modelChoice)?.id ??
    brandModels.find((model) => model.id === initialModelId)?.id ??
    brandModels[0]?.id ??
    "";
  const [cityChoice, setCityChoice] = useState(initialCitySlug ?? "");
  const activeCitySlug =
    cities.find((city) => city.slug === cityChoice)?.slug ??
    cities.find((city) => city.slug === initialCitySlug)?.slug ??
    cities[0]?.slug ??
    "";
  const modelVariants = variants.filter((variant) => variant.modelId === activeModelId);
  const activeModel = models.find((model) => model.id === activeModelId);
  const activeBrand = brands.find((brand) => brand.id === activeBrandId);
  const activeVariant = modelVariants.find((variant) => variant.isDefault) ?? modelVariants[0];
  const priceParams = new URLSearchParams({ city: activeCitySlug });

  if (activeBrand?.slug) priceParams.set("brand", activeBrand.slug);
  if (activeModel?.slug) priceParams.set("model", activeModel.slug);
  if (activeVariant?.slug) priceParams.set("variant", activeVariant.slug);

  return (
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
        <select className="block min-w-0 w-full truncate rounded-md border border-slate-200 px-3 py-3 text-sm" value={activeBrandId} onChange={(event) => setBrandChoice(event.target.value)}>
          {!filteredBrands.length ? <option value="">Brands coming soon</option> : null}
          {filteredBrands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
        </select>
        </div>
        <div className="min-w-0">
        <select className="block min-w-0 w-full truncate rounded-md border border-slate-200 px-3 py-3 text-sm" value={activeModelId} onChange={(event) => setModelChoice(event.target.value)}>
          {!brandModels.length ? <option value="">Select a model</option> : null}
          {brandModels.map((model) => <option value={model.id} key={model.id}>{model.name}</option>)}
        </select>
        </div>
        <div className="min-w-0">
        <select className="block min-w-0 w-full truncate rounded-md border border-slate-200 px-3 py-3 text-sm" value={activeCitySlug} onChange={(event) => setCityChoice(event.target.value)}>
          {!cities.length ? <option value="">Cities coming soon</option> : null}
          {cities.map((city) => <option value={city.slug} key={city.id}>{city.name}</option>)}
        </select>
        </div>
        <a
          className={`min-w-0 rounded-md px-4 py-3 text-center text-sm font-black text-slate-950 ${
            activeBrand && activeModel && activeCitySlug
              ? "bg-emerald-500 hover:bg-lime-400"
              : "pointer-events-none bg-slate-200 text-slate-500"
          }`}
          href={`/on-road-price?${priceParams.toString()}`}
          aria-disabled={!activeBrand || !activeModel || !activeCitySlug}
        >
          Check on-road price
        </a>
      </div>
      {activeModel ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
            {modelVariants.length} variant{modelVariants.length === 1 ? "" : "s"}
          </span>
          {activeVariant ? (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              Starts {formatShortPrice(activeVariant.exShowroomPrice)}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
