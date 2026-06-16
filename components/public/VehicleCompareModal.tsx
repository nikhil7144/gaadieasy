"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { GitCompareArrows, Loader2, X } from "lucide-react";
import { VehicleImage } from "@/components/public/VehicleImage";
import { formatIndianPrice, formatShortPrice } from "@/lib/utils/format";
import type { Brand, City, PriceBreakdown, VehicleCategory, VehicleModel, VehicleVariant } from "@/types/automobile";

export type ComparableModel = VehicleModel & {
  brand?: Brand;
  category?: VehicleCategory;
  variants: VehicleVariant[];
};

type SelectionState = {
  brandId: string;
  modelId: string;
  variantId: string;
};

type VehicleCompareModalProps = {
  models: ComparableModel[];
  brands: Brand[];
  cities: City[];
  initialModelId: string;
  citySlug?: string;
  className?: string;
};

type PricingApiResult = {
  pricing?: {
    breakdown: PriceBreakdown;
  };
};

function activeVariants(model?: ComparableModel) {
  return (model?.variants ?? [])
    .filter((variant) => variant.active)
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0) || left.exShowroomPrice - right.exShowroomPrice);
}

function defaultSelection(model?: ComparableModel): SelectionState {
  const variant = activeVariants(model).find((item) => item.isDefault) ?? activeVariants(model)[0];

  return {
    brandId: model?.brandId ?? "",
    modelId: model?.id ?? "",
    variantId: variant?.id ?? "",
  };
}

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function firstValue(values: string[]) {
  return values.length ? values.join(" / ") : "-";
}

function getSpecValue(variant: VehicleVariant | undefined, paths: Array<[string, string]>) {
  if (!variant) return "-";

  for (const [section, key] of paths) {
    const group = variant.specifications?.[section];
    if (group && typeof group === "object" && !Array.isArray(group)) {
      const value = (group as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return "-";
}

function selectionLabel(model?: ComparableModel, variant?: VehicleVariant) {
  return [model?.brand?.name, model?.name, variant?.name].filter(Boolean).join(" ");
}

export function VehicleCompareModal({ models, brands, cities, initialModelId, citySlug = "bangalore", className }: VehicleCompareModalProps) {
  const [open, setOpen] = useState(false);
  const initialModel = useMemo(() => models.find((model) => model.id === initialModelId) ?? models[0], [initialModelId, models]);
  const compareModels = useMemo(() => {
    if (!initialModel) return [];
    return models.filter((model) => model.active && model.categoryId === initialModel.categoryId && activeVariants(model).length);
  }, [initialModel, models]);
  const defaultLeft = defaultSelection(initialModel);
  const defaultRight = defaultSelection(compareModels.find((model) => model.id !== initialModel?.id) ?? initialModel);
  const [left, setLeft] = useState<SelectionState>(defaultLeft);
  const [right, setRight] = useState<SelectionState>(defaultRight);
  const [selectedCity, setSelectedCity] = useState(citySlug);
  const [prices, setPrices] = useState<Record<"left" | "right", PriceBreakdown | undefined>>({ left: undefined, right: undefined });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const brandOptions = useMemo(() => {
    const ids = new Set(compareModels.map((model) => model.brandId));
    return brands.filter((brand) => brand.active && ids.has(brand.id));
  }, [brands, compareModels]);

  const modelsForBrand = (brandId: string) => compareModels.filter((model) => model.brandId === brandId);
  const leftModel = compareModels.find((model) => model.id === left.modelId);
  const rightModel = compareModels.find((model) => model.id === right.modelId);
  const leftVariant = activeVariants(leftModel).find((variant) => variant.id === left.variantId);
  const rightVariant = activeVariants(rightModel).find((variant) => variant.id === right.variantId);
  const categoryName = initialModel?.category?.name ?? initialModel?.bodyType ?? "vehicle";

  function updateSelection(side: "left" | "right", patch: Partial<SelectionState>) {
    const setter = side === "left" ? setLeft : setRight;
    const current = side === "left" ? left : right;
    let next = { ...current, ...patch };

    if (patch.brandId) {
      const nextModel = modelsForBrand(patch.brandId)[0];
      next = defaultSelection(nextModel);
    } else if (patch.modelId) {
      const nextModel = compareModels.find((model) => model.id === patch.modelId);
      next = { ...next, ...defaultSelection(nextModel), brandId: nextModel?.brandId ?? next.brandId };
    }

    setter(next);
    setPrices({ left: undefined, right: undefined });
    setError("");
  }

  async function fetchPrice(selection: SelectionState) {
    const model = compareModels.find((item) => item.id === selection.modelId);
    const variant = activeVariants(model).find((item) => item.id === selection.variantId);
    const params = new URLSearchParams({
      city: selectedCity,
      model: model?.slug ?? "",
      variant: variant?.slug ?? "",
    });
    if (model?.brand?.slug) params.set("brand", model.brand.slug);

    const response = await fetch(`/api/public/pricing?${params.toString()}`);
    if (!response.ok) throw new Error("Could not calculate compare price.");
    const data = (await response.json()) as PricingApiResult;
    return data.pricing?.breakdown;
  }

  async function runCompare() {
    setLoading(true);
    setError("");
    try {
      const [leftPrice, rightPrice] = await Promise.all([fetchPrice(left), fetchPrice(right)]);
      setPrices({ left: leftPrice, right: rightPrice });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not compare these vehicles.");
    } finally {
      setLoading(false);
    }
  }

  function renderSelector(side: "left" | "right", selection: SelectionState, model?: ComparableModel, variant?: VehicleVariant) {
    const modelOptions = modelsForBrand(selection.brandId);
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex gap-3">
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-white">
            <VehicleImage className="h-full w-full object-cover" src={model?.imageUrl} alt={model?.name ?? "Vehicle"} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase text-emerald-700">{side === "left" ? "Vehicle 1" : "Vehicle 2"}</div>
            <div className="mt-1 line-clamp-2 text-base font-black text-slate-950">{selectionLabel(model, variant) || "Select vehicle"}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400"
            value={selection.brandId}
            onChange={(event) => updateSelection(side, { brandId: event.target.value })}
          >
            {brandOptions.map((brand) => (
              <option value={brand.id} key={brand.id}>{brand.name}</option>
            ))}
          </select>
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400"
            value={selection.modelId}
            onChange={(event) => updateSelection(side, { modelId: event.target.value })}
          >
            {modelOptions.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
          <select
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400"
            value={selection.variantId}
            onChange={(event) => updateSelection(side, { variantId: event.target.value })}
          >
            {activeVariants(model).map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Price",
      rows: [
        ["On-road price", prices.left ? formatIndianPrice(prices.left.totalOnRoadPrice) : "Press Compare", prices.right ? formatIndianPrice(prices.right.totalOnRoadPrice) : "Press Compare"],
        ["Ex-showroom", formatShortPrice(leftVariant?.exShowroomPrice ?? 0), formatShortPrice(rightVariant?.exShowroomPrice ?? 0)],
        ["Road tax", prices.left ? formatIndianPrice(prices.left.roadTax) : "-", prices.right ? formatIndianPrice(prices.right.roadTax) : "-"],
        ["Insurance", prices.left ? formatIndianPrice(prices.left.insurance) : "-", prices.right ? formatIndianPrice(prices.right.insurance) : "-"],
      ],
    },
    {
      title: "Core Details",
      rows: [
        ["Fuel", leftVariant?.fuelType ?? "-", rightVariant?.fuelType ?? "-"],
        ["Transmission", leftVariant?.transmission ?? "-", rightVariant?.transmission ?? "-"],
        ["Engine / Motor", leftVariant?.engineCapacity ?? "-", rightVariant?.engineCapacity ?? "-"],
        ["Mileage / Range", leftVariant?.mileage ?? "-", rightVariant?.mileage ?? "-"],
        ["Body type", leftModel?.bodyType ?? "-", rightModel?.bodyType ?? "-"],
      ],
    },
    {
      title: "Capacity",
      rows: [
        ["Seating", leftVariant ? `${leftVariant.seatingCapacity} seats` : "-", rightVariant ? `${rightVariant.seatingCapacity} seats` : "-"],
        ["Payload", getSpecValue(leftVariant, [["commercial", "payload"], ["commercial", "payloadCapacity"]]), getSpecValue(rightVariant, [["commercial", "payload"], ["commercial", "payloadCapacity"]])],
        ["Battery", getSpecValue(leftVariant, [["ev", "batteryCapacity"], ["ev", "battery"]]), getSpecValue(rightVariant, [["ev", "batteryCapacity"], ["ev", "battery"]])],
        ["Power", getSpecValue(leftVariant, [["engine", "power"], ["bike", "power"], ["commercial", "power"]]), getSpecValue(rightVariant, [["engine", "power"], ["bike", "power"], ["commercial", "power"]])],
      ],
    },
    {
      title: "Features",
      rows: [
        ["Highlights", firstValue(uniqueValues(leftVariant?.specifications?.highlights ?? []).slice(0, 3)), firstValue(uniqueValues(rightVariant?.specifications?.highlights ?? []).slice(0, 3))],
        ["Top features", firstValue(uniqueValues(leftVariant?.specifications?.features ?? []).slice(0, 4)), firstValue(uniqueValues(rightVariant?.specifications?.features ?? []).slice(0, 4))],
        ["Safety", getSpecValue(leftVariant, [["safety", "rating"], ["safety", "airbags"], ["safety", "abs"]]), getSpecValue(rightVariant, [["safety", "rating"], ["safety", "airbags"], ["safety", "abs"]])],
      ],
    },
  ];

  const modal = open ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-3 py-5 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Vehicle comparison"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{categoryName} comparison</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">Compare vehicles</h3>
            <p className="mt-1 text-sm text-slate-500">Select brand, model and variant for the same category.</p>
          </div>
          <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" onClick={() => setOpen(false)} type="button" aria-label="Close comparison">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_180px]">
            {renderSelector("left", left, leftModel, leftVariant)}
            {renderSelector("right", right, rightModel, rightVariant)}
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <label className="text-xs font-black uppercase text-emerald-800">City</label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400"
                value={selectedCity}
                onChange={(event) => {
                  setSelectedCity(event.target.value);
                  setPrices({ left: undefined, right: undefined });
                }}
              >
                {cities.map((city) => (
                  <option value={city.slug} key={city.id}>{city.name}</option>
                ))}
              </select>
              <button
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={loading || !leftVariant || !rightVariant}
                onClick={runCompare}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompareArrows className="h-4 w-4" />}
                Compare
              </button>
              {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {sections.map((section) => (
              <section className="overflow-hidden rounded-lg border border-slate-200" key={section.title}>
                <div className="bg-slate-950 px-4 py-3 text-sm font-black text-white">{section.title}</div>
                <div className="divide-y divide-slate-100">
                  {section.rows.map(([label, leftValue, rightValue]) => (
                    <div className="grid gap-2 p-3 text-sm sm:grid-cols-[180px_1fr_1fr]" key={label}>
                      <div className="font-black text-slate-500">{label}</div>
                      <div className="rounded-md bg-slate-50 px-3 py-2 font-bold text-slate-950">{leftValue}</div>
                      <div className="rounded-md bg-emerald-50 px-3 py-2 font-bold text-slate-950">{rightValue}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        className={className ?? "inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-lime-200"}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <GitCompareArrows className="h-3.5 w-3.5" />
        Compare
      </button>

      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
