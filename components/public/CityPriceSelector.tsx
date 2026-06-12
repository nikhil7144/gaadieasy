"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { City } from "@/types/automobile";

type Props = {
  cities: City[];
  currentCitySlug: string;
  brandSlug: string;
  modelSlug: string;
  variantSlug: string;
};

export function CityPriceSelector({ cities, currentCitySlug, brandSlug, modelSlug, variantSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCityChange(citySlug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("brand", brandSlug);
    params.set("model", modelSlug);
    params.set("variant", variantSlug);
    params.set("city", citySlug);
    router.push(`/on-road-price?${params.toString()}#price`);
  }

  return (
    <label className="block min-w-0 sm:min-w-44">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-emerald-700">Change city</span>
      <select
        value={currentCitySlug}
        onChange={(event) => handleCityChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm font-black text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-lime-200"
      >
        {cities.map((city) => (
          <option value={city.slug} key={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}
