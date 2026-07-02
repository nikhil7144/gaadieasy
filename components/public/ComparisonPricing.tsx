"use client";

import { useState } from "react";
import { formatIndianPrice, formatShortPrice } from "@/lib/utils/format";
import type { Brand, City, PriceBreakdown, VehicleModel, VehicleVariant } from "@/types/automobile";

type ComparisonVehicle = {
  brand: Brand;
  model: VehicleModel;
  variant: VehicleVariant;
  breakdown: PriceBreakdown;
};

type Props = {
  vehicles: ComparisonVehicle[];
  initialCity: City;
  cities: City[];
};

const rows: Array<[string, (vehicle: ComparisonVehicle, breakdown: PriceBreakdown) => string]> = [
  ["On-road price", (_vehicle, breakdown) => formatIndianPrice(breakdown.totalOnRoadPrice)],
  ["Ex-showroom", (vehicle) => formatShortPrice(vehicle.variant.exShowroomPrice)],
  ["Fuel", (vehicle) => vehicle.variant.fuelType ?? "-"],
  ["Transmission", (vehicle) => vehicle.variant.transmission ?? "-"],
  ["Engine / Battery", (vehicle) => vehicle.variant.engineCapacity ?? "-"],
  ["Mileage / Range", (vehicle) => vehicle.variant.mileage ?? "-"],
  ["Seating", (vehicle) => `${vehicle.variant.seatingCapacity ?? "-"} seats`],
  ["Body type", (vehicle) => vehicle.model.bodyType ?? "-"],
  ["Safety", (vehicle) => vehicle.variant.specifications.safety.rating ?? "-"],
  ["Top features", (vehicle) => vehicle.variant.specifications.features.slice(0, 4).join(", ") ?? "-"],
];

export function ComparisonPricing({ vehicles, initialCity, cities }: Props) {
  const [citySlug, setCitySlug] = useState(initialCity.slug);
  const [cityName, setCityName] = useState(initialCity.name);
  const [breakdowns, setBreakdowns] = useState<PriceBreakdown[]>(vehicles.map((v) => v.breakdown));
  const [loading, setLoading] = useState(false);

  async function handleCityChange(newSlug: string) {
    const city = cities.find((c) => c.slug === newSlug);
    setCitySlug(newSlug);
    if (city) setCityName(city.name);
    setLoading(true);

    try {
      const results = await Promise.all(
        vehicles.map(async (vehicle) => {
          const params = new URLSearchParams({
            brand: vehicle.brand.slug,
            model: vehicle.model.slug,
            variant: vehicle.variant.slug,
            city: newSlug,
          });
          const response = await fetch(`/api/public/pricing?${params.toString()}`);
          const data = (await response.json()) as { pricing?: { breakdown: PriceBreakdown } };
          return data.pricing?.breakdown;
        }),
      );
      setBreakdowns((current) => results.map((next, index) => next ?? current[index]));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-slate-700" htmlFor="comparison-city">
          City
        </label>
        <select
          id="comparison-city"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800"
          value={citySlug}
          onChange={(event) => handleCityChange(event.target.value)}
          disabled={loading}
        >
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
        {loading ? <span className="text-xs font-bold text-slate-500">Updating prices…</span> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle, index) => (
          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={vehicle.variant.id}>
            <div className="aspect-[16/10] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-full w-full object-cover" src={vehicle.model.imageUrl} alt={vehicle.model.name} />
            </div>
            <div className="p-4">
              <div className="text-xs font-bold text-emerald-700">{vehicle.brand.name}</div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{vehicle.model.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{vehicle.variant.name}</p>
              <div className="mt-4 rounded-lg bg-lime-300 p-3">
                <div className="text-xs font-bold uppercase text-slate-700">On-road in {cityName}</div>
                <div className="mt-1 text-xl font-black text-slate-950">
                  {formatIndianPrice(breakdowns[index]?.totalOnRoadPrice ?? 0)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Parameter</th>
              {vehicles.map((vehicle) => (
                <th className="p-4" key={vehicle.variant.id}>
                  {vehicle.brand.name} {vehicle.model.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([label, getValue]) => (
              <tr key={label}>
                <td className="p-4 font-black text-slate-950">{label}</td>
                {vehicles.map((vehicle, index) => (
                  <td className="p-4 text-slate-600" key={vehicle.variant.id}>
                    {getValue(vehicle, breakdowns[index] ?? vehicle.breakdown)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
