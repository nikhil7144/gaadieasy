"use client";

import { useState } from "react";
import { formatShortPrice } from "@/lib/utils/format";

export type VariantPriceRow = {
  id: string;
  name: string;
  slug: string;
  fuelType: string;
  transmission: string;
  totalOnRoadPrice: number;
};

function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="text-xs font-black uppercase tracking-wide text-slate-400 shrink-0">{label}</span>
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-emerald-600"
          />
          <span className={`text-sm font-bold ${value === opt ? "text-emerald-700" : "text-slate-600"}`}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function VariantsPriceTable({
  rows,
  brandSlug,
  modelSlug,
  citySlug,
  activeVariantId,
}: {
  rows: VariantPriceRow[];
  brandSlug: string;
  modelSlug: string;
  citySlug: string;
  activeVariantId: string;
}) {
  const [fuel, setFuel] = useState("All");
  const [transmission, setTransmission] = useState("All");

  const fuelOptions = ["All", ...Array.from(new Set(rows.map((r) => r.fuelType))).sort()];
  const transmissionOptions = ["All", ...Array.from(new Set(rows.map((r) => r.transmission))).sort()];

  const filtered = rows.filter((r) => {
    return (fuel === "All" || r.fuelType === fuel) && (transmission === "All" || r.transmission === transmission);
  });

  return (
    <div>
      <div className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <RadioGroup label="Fuel" name="fuel" options={fuelOptions} value={fuel} onChange={setFuel} />
        <RadioGroup label="Transmission" name="transmission" options={transmissionOptions} value={transmission} onChange={setTransmission} />
      </div>

      {filtered.length < rows.length ? (
        <p className="mt-2 text-xs font-bold text-slate-400">{filtered.length} of {rows.length} variants shown</p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm font-bold text-slate-500">No variants match the selected filters.</p>
      ) : (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {filtered.map((row) => {
              const active = row.id === activeVariantId;
              return (
                <a
                  key={row.id}
                  href={`/on-road-price?brand=${brandSlug}&model=${modelSlug}&variant=${row.slug}&city=${citySlug}`}
                  className={`block rounded-lg border p-3 text-sm ${active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-950 break-words">{row.name}</div>
                      <div className="mt-1 text-slate-500">{row.fuelType} · {row.transmission}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                      {active ? "Selected" : "View"}
                    </span>
                  </div>
                  <div className="mt-3 text-lg font-black text-slate-950">{formatShortPrice(row.totalOnRoadPrice)}</div>
                </a>
              );
            })}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <div className="min-w-[640px] divide-y divide-slate-100">
              {filtered.map((row) => {
                const active = row.id === activeVariantId;
                return (
                  <a
                    key={row.id}
                    href={`/on-road-price?brand=${brandSlug}&model=${modelSlug}&variant=${row.slug}&city=${citySlug}`}
                    className={`grid grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto] items-center gap-3 py-3 text-sm ${active ? "rounded-lg bg-emerald-50 px-3" : "px-3 hover:bg-slate-50"}`}
                  >
                    <span className="font-black text-slate-950">{row.name}</span>
                    <span className="text-slate-500">{row.fuelType}</span>
                    <span className="text-slate-500">{row.transmission}</span>
                    <span className="font-black text-slate-950">{formatShortPrice(row.totalOnRoadPrice)}</span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                      {active ? "Selected" : "View"}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
