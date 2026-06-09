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
  const allowedBrandIds = new Set(filteredModels.map((model) => model.brandId));
  const filteredBrands = brands.filter((brand) => allowedBrandIds.has(brand.id));
  const [brandId, setBrandId] = useState(initialBrandId ?? filteredBrands[0]?.id ?? "brand-hyundai");
  const brandModels = useMemo(
    () => filteredModels.filter((model) => model.brandId === brandId),
    [brandId, filteredModels],
  );
  const [modelId, setModelId] = useState(initialModelId ?? brandModels[0]?.id ?? "model-creta");
  const [citySlug, setCitySlug] = useState(initialCitySlug ?? cities[0]?.slug ?? "bangalore");
  const activeModelId = brandModels.some((model) => model.id === modelId) ? modelId : brandModels[0]?.id;
  const modelVariants = variants.filter((variant) => variant.modelId === activeModelId);
  const activeModel = models.find((model) => model.id === activeModelId);
  const activeBrand = brands.find((brand) => brand.id === brandId);
  const activeVariant = modelVariants.find((variant) => variant.isDefault) ?? modelVariants[0];
  const priceParams = new URLSearchParams({ city: citySlug });

  if (activeBrand?.slug) priceParams.set("brand", activeBrand.slug);
  if (activeModel?.slug) priceParams.set("model", activeModel.slug);
  if (activeVariant?.slug) priceParams.set("variant", activeVariant.slug);

  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-3 md:grid-cols-4">
        <select className="rounded-md border border-slate-200 px-3 py-3 text-sm" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
          {filteredBrands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
        </select>
        <select className="rounded-md border border-slate-200 px-3 py-3 text-sm" value={activeModelId} onChange={(event) => setModelId(event.target.value)}>
          {brandModels.map((model) => <option value={model.id} key={model.id}>{model.name}</option>)}
        </select>
        <select className="rounded-md border border-slate-200 px-3 py-3 text-sm" value={citySlug} onChange={(event) => setCitySlug(event.target.value)}>
          {cities.map((city) => <option value={city.slug} key={city.id}>{city.name}</option>)}
        </select>
        <a
          className="rounded-md bg-emerald-500 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-lime-400"
          href={`/on-road-price?${priceParams.toString()}`}
        >
          Check on-road price
        </a>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {modelVariants.map((variant) => (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800" key={variant.id}>
            {variant.name} from {formatShortPrice(variant.exShowroomPrice)}
          </span>
        ))}
      </div>
    </section>
  );
}
