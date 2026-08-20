"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormField } from "@/components/seller/FormField";
import { SellerProductVariantsEditor } from "@/components/seller/SellerProductVariantsEditor";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "@/components/seller/dashboardStyles";
import { describeApiError } from "@/lib/utils/api-error";
import type { Brand, GearCategory, GearProduct, VehicleModel, VehicleType } from "@/types/automobile";
import type { BrowseVariant } from "@/lib/repositories/vehicle-data";

async function sendJson(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(describeApiError(payload, `HTTP ${response.status}`));
  return payload;
}

// Same strict cascading drill-down as before: vehicle type is always
// mandatory first; "universal" at each level just means "select all" at that
// level instead of drilling further.
type ModelSelection = { modelId: string; allVariants: boolean; variantIds: string[] };
type BrandSelection = { brandId: string; allModels: boolean; modelSelections: ModelSelection[] };

type FormState = {
  id?: string;
  categoryId: string;
  brandId: string;
  title: string;
  description: string;
  gstRate: string;
  images: string[];
  // Only used (and only shown/sent) while creating a brand-new product -- it
  // bootstraps the mandatory first variant. Once a product exists, all
  // price/stock/size/color editing happens on the Variants step instead,
  // since a product can have several variants at different prices by then.
  defaultSize: string;
  defaultColor: string;
  defaultMrp: string;
  defaultSellingPrice: string;
  defaultStockQty: string;
  compatUniversal: boolean;
  compatVehicleTypeId: string;
  compatAllBrands: boolean;
  compatBrandSelections: BrandSelection[];
};

function emptyForm(): FormState {
  return {
    categoryId: "",
    brandId: "",
    title: "",
    description: "",
    gstRate: "18",
    images: [],
    defaultSize: "",
    defaultColor: "",
    defaultMrp: "",
    defaultSellingPrice: "",
    defaultStockQty: "0",
    compatUniversal: false,
    compatVehicleTypeId: "",
    compatAllBrands: true,
    compatBrandSelections: [],
  };
}

function buildCompatibility(f: FormState) {
  if (f.compatUniversal) {
    return [{ compatibilityType: "global" as const }];
  }
  if (f.compatAllBrands) {
    return [{ compatibilityType: "vehicle_type" as const, vehicleTypeId: f.compatVehicleTypeId }];
  }

  const rows: Array<{
    compatibilityType: "brand" | "model" | "variant";
    vehicleTypeId: string;
    vehicleBrandId?: string;
    vehicleModelId?: string;
    vehicleVariantId?: string;
  }> = [];

  for (const bs of f.compatBrandSelections) {
    if (bs.allModels) {
      rows.push({ compatibilityType: "brand", vehicleTypeId: f.compatVehicleTypeId, vehicleBrandId: bs.brandId });
      continue;
    }
    for (const ms of bs.modelSelections) {
      if (ms.allVariants) {
        rows.push({ compatibilityType: "model", vehicleTypeId: f.compatVehicleTypeId, vehicleModelId: ms.modelId });
      } else {
        for (const variantId of ms.variantIds) {
          rows.push({
            compatibilityType: "variant",
            vehicleTypeId: f.compatVehicleTypeId,
            vehicleModelId: ms.modelId,
            vehicleVariantId: variantId,
          });
        }
      }
    }
  }
  return rows;
}

function reconstructCompatibility(
  rows: { compatibilityType: string; vehicleTypeId?: string; vehicleBrandId?: string; vehicleModelId?: string; vehicleVariantId?: string }[],
  modelById: Map<string, VehicleModel>,
): Pick<FormState, "compatUniversal" | "compatVehicleTypeId" | "compatAllBrands" | "compatBrandSelections"> {
  const globalRow = rows.find((r) => r.compatibilityType === "global");
  if (globalRow) {
    return { compatUniversal: true, compatVehicleTypeId: "", compatAllBrands: true, compatBrandSelections: [] };
  }

  const vehicleTypeRow = rows.find((r) => r.compatibilityType === "vehicle_type");
  if (vehicleTypeRow) {
    return { compatUniversal: false, compatVehicleTypeId: vehicleTypeRow.vehicleTypeId ?? "", compatAllBrands: true, compatBrandSelections: [] };
  }

  const scopedRows = rows.filter((r) => r.compatibilityType === "brand" || r.compatibilityType === "model" || r.compatibilityType === "variant");
  if (scopedRows.length === 0) {
    return { compatUniversal: false, compatVehicleTypeId: "", compatAllBrands: true, compatBrandSelections: [] };
  }

  const vehicleTypeId = scopedRows[0].vehicleTypeId ?? "";
  const brandMap = new Map<string, BrandSelection>();

  for (const row of scopedRows) {
    if (row.compatibilityType === "brand" && row.vehicleBrandId) {
      brandMap.set(row.vehicleBrandId, { brandId: row.vehicleBrandId, allModels: true, modelSelections: [] });
      continue;
    }

    const brandId = row.vehicleModelId ? modelById.get(row.vehicleModelId)?.brandId : undefined;
    if (!brandId) continue;
    const brand = brandMap.get(brandId) ?? { brandId, allModels: false, modelSelections: [] };

    if (row.compatibilityType === "model" && row.vehicleModelId) {
      if (!brand.modelSelections.some((m) => m.modelId === row.vehicleModelId)) {
        brand.modelSelections.push({ modelId: row.vehicleModelId, allVariants: true, variantIds: [] });
      }
    } else if (row.compatibilityType === "variant" && row.vehicleModelId && row.vehicleVariantId) {
      const existing = brand.modelSelections.find((m) => m.modelId === row.vehicleModelId);
      if (existing) {
        existing.allVariants = false;
        existing.variantIds.push(row.vehicleVariantId);
      } else {
        brand.modelSelections.push({ modelId: row.vehicleModelId, allVariants: false, variantIds: [row.vehicleVariantId] });
      }
    }
    brandMap.set(brandId, brand);
  }

  return { compatUniversal: false, compatVehicleTypeId: vehicleTypeId, compatAllBrands: false, compatBrandSelections: Array.from(brandMap.values()) };
}

function validateCompatibility(f: FormState): string | null {
  if (f.compatUniversal) return null;
  if (!f.compatVehicleTypeId) return "Choose a vehicle type, or mark this product as universal.";
  if (f.compatAllBrands) return null;
  if (f.compatBrandSelections.length === 0) return "Add at least one brand, or check \"all brands\".";
  for (const bs of f.compatBrandSelections) {
    if (bs.allModels) continue;
    if (bs.modelSelections.length === 0) return "Add at least one model for each brand, or check \"all models\".";
    for (const ms of bs.modelSelections) {
      if (ms.allVariants) continue;
      if (ms.variantIds.length === 0) return "Select at least one variant for each model, or check \"all variants\".";
    }
  }
  return null;
}

type StepKey = "basic" | "photos" | "compatibility" | "variants" | "review";

type Dot = "green" | "amber" | "gray";

function ReadinessDot({ tone }: { tone: Dot }) {
  const cls = tone === "green" ? "bg-[#3ecf8e]" : tone === "amber" ? "bg-amber-500" : "bg-black/20";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

export function SellerProductEditor({
  product,
  categories,
  vehicleTypes,
  brands,
  models,
  variants,
  initialVariantCount,
}: {
  product?: GearProduct;
  categories: GearCategory[];
  vehicleTypes: VehicleType[];
  brands: Brand[];
  models: VehicleModel[];
  variants: BrowseVariant[];
  initialVariantCount: number;
}) {
  const router = useRouter();
  const modelById = useMemo(() => new Map(models.map((m) => [m.id, m])), [models]);
  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const [form, setForm] = useState<FormState>(() => {
    if (!product) return emptyForm();
    const compat = reconstructCompatibility(product.compatibility ?? [], modelById);
    return {
      id: product.id,
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      title: product.title,
      description: product.description ?? "",
      gstRate: String(product.gstRate),
      images: product.images ?? [],
      defaultSize: "",
      defaultColor: "",
      defaultMrp: "",
      defaultSellingPrice: "",
      defaultStockQty: "0",
      ...compat,
    };
  });
  const [step, setStep] = useState<StepKey>("basic");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variantCount, setVariantCount] = useState(initialVariantCount);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basicReady =
    form.title.trim().length >= 3 &&
    Boolean(form.categoryId) &&
    (Boolean(form.id) || (Number(form.defaultMrp) > 0 && Number(form.defaultSellingPrice) > 0));
  const photosReady = form.images.length > 0;
  const compatReady = validateCompatibility(form) === null;
  const reviewReady = basicReady && photosReady && compatReady;

  const publishBlockedReasons = [
    !basicReady && (form.id ? "title and category are required" : "title, category, and the default variant's MRP and selling price are required"),
    !photosReady && "add at least one photo",
    !compatReady && "choose what this fits under Compatibility",
  ].filter((reason): reason is string => Boolean(reason));

  const steps: { key: StepKey; label: string; dot: Dot }[] = [
    { key: "basic", label: "Basic details", dot: basicReady ? "green" : "amber" },
    { key: "photos", label: "Photos", dot: photosReady ? "green" : "amber" },
    { key: "compatibility", label: "Compatibility", dot: compatReady ? "green" : "amber" },
    { key: "variants", label: "Variants", dot: variantCount > 0 ? "green" : "gray" },
    { key: "review", label: "Review", dot: reviewReady ? "green" : "gray" },
  ];

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/seller/upload-image", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setForm((prev) => ({ ...prev, images: [...prev.images, payload.url] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  }

  function updateBrandSelections(updater: (list: BrandSelection[]) => BrandSelection[]) {
    setForm((prev) => ({ ...prev, compatBrandSelections: updater(prev.compatBrandSelections) }));
  }

  function addBrand(brandId: string) {
    if (!brandId) return;
    updateBrandSelections((list) => (list.some((b) => b.brandId === brandId) ? list : [...list, { brandId, allModels: true, modelSelections: [] }]));
  }
  function removeBrand(brandId: string) {
    updateBrandSelections((list) => list.filter((b) => b.brandId !== brandId));
  }
  function toggleAllModels(brandId: string, allModels: boolean) {
    updateBrandSelections((list) => list.map((b) => (b.brandId === brandId ? { ...b, allModels } : b)));
  }
  function addModel(brandId: string, modelId: string) {
    if (!modelId) return;
    updateBrandSelections((list) =>
      list.map((b) =>
        b.brandId === brandId && !b.modelSelections.some((m) => m.modelId === modelId)
          ? { ...b, modelSelections: [...b.modelSelections, { modelId, allVariants: true, variantIds: [] }] }
          : b,
      ),
    );
  }
  function removeModel(brandId: string, modelId: string) {
    updateBrandSelections((list) => list.map((b) => (b.brandId === brandId ? { ...b, modelSelections: b.modelSelections.filter((m) => m.modelId !== modelId) } : b)));
  }
  function toggleAllVariants(brandId: string, modelId: string, allVariants: boolean) {
    updateBrandSelections((list) =>
      list.map((b) => (b.brandId === brandId ? { ...b, modelSelections: b.modelSelections.map((m) => (m.modelId === modelId ? { ...m, allVariants } : m)) } : b)),
    );
  }
  function toggleVariant(brandId: string, modelId: string, variantId: string) {
    updateBrandSelections((list) =>
      list.map((b) =>
        b.brandId === brandId
          ? {
              ...b,
              modelSelections: b.modelSelections.map((m) =>
                m.modelId === modelId
                  ? { ...m, variantIds: m.variantIds.includes(variantId) ? m.variantIds.filter((v) => v !== variantId) : [...m.variantIds, variantId] }
                  : m,
              ),
            }
          : b,
      ),
    );
  }

  function buildUpdatePayload() {
    return {
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      title: form.title,
      description: form.description || undefined,
      gstRate: Number(form.gstRate),
      images: form.images,
      compatibility: buildCompatibility(form),
    };
  }

  async function save() {
    const validationError = validateCompatibility(form);
    if (validationError) {
      setError(validationError);
      setStep("compatibility");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await sendJson("/api/seller/products", "PATCH", { action: "update", id: form.id, ...buildUpdatePayload() });
        router.refresh();
      } else {
        const createPayload = {
          ...buildUpdatePayload(),
          defaultVariant: {
            size: form.defaultSize || undefined,
            color: form.defaultColor || undefined,
            mrp: Number(form.defaultMrp),
            sellingPrice: Number(form.defaultSellingPrice),
            stockQty: Number(form.defaultStockQty),
          },
        };
        const { product: created } = await sendJson("/api/seller/products", "POST", createPayload);
        setForm((prev) => ({ ...prev, id: created.id }));
        router.replace(`/seller/products/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  // Publish always saves the current form state first -- otherwise a photo
  // uploaded (or any other field edited) but not yet explicitly "Save"d would
  // still be missing from the persisted record the publish check runs
  // against, rejecting with a confusing "add a photo" error despite one
  // being visibly attached in the UI.
  async function publish() {
    if (!form.id) return;
    const validationError = validateCompatibility(form);
    if (validationError) {
      setError(validationError);
      setStep("compatibility");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await sendJson("/api/seller/products", "PATCH", { action: "update", id: form.id, ...buildUpdatePayload() });
      await sendJson("/api/seller/products", "PATCH", { action: "publish", id: form.id });
      router.push("/seller/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to publish");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Link className="flex items-center gap-1 font-bold text-[#6b7280] hover:text-[#171717]" href="/seller/products">
            <ArrowLeft size={14} strokeWidth={2} /> Products
          </Link>
          <span className="text-black/20">/</span>
          <span className="font-bold text-[#171717]">{product ? product.title : "New product"}</span>
        </div>
        <div className="flex gap-2">
          <button className={ghostButtonClass} onClick={() => router.push("/seller/products")} type="button">
            Cancel
          </button>
          <button className={primaryButtonClass} disabled={saving} onClick={save} type="button">
            {saving ? "Saving…" : "Save"}
          </button>
          {form.id && (product?.status === "draft" || product?.status === "rejected" || product?.status === "pending_review") && (
            <button
              className={primaryButtonClass}
              disabled={saving || !reviewReady}
              onClick={publish}
              title={reviewReady ? undefined : `Before you can publish: ${publishBlockedReasons.join("; ")}.`}
              type="button"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-[#ef4444]">{error}</p>}

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <nav className="space-y-0.5">
          {steps.map((s) => (
            <button
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-bold transition ${
                step === s.key ? "bg-[#3ecf8e]/10 text-[#0f8a5f]" : "text-[#6b7280] hover:bg-[#f4f5f7]"
              }`}
              key={s.key}
              onClick={() => setStep(s.key)}
              type="button"
            >
              <ReadinessDot tone={s.dot} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="rounded-lg border border-black/[0.08] bg-white p-5">
          {step === "basic" && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Product title">
                  <input className={fieldClass} onChange={(e) => setForm({ ...form, title: e.target.value })} value={form.title} />
                </FormField>
                <FormField label="Category">
                  <select className={fieldClass} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} value={form.categoryId}>
                    <option value="">Category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="GST %">
                  <input className={fieldClass} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} type="number" value={form.gstRate} />
                </FormField>
                <FormField className="md:col-span-2" label="Description">
                  <textarea className={`${fieldClass} h-24 py-2`} onChange={(e) => setForm({ ...form, description: e.target.value })} value={form.description} />
                </FormField>
              </div>

              {!form.id && (
                <div className="rounded-lg border border-black/[0.08] bg-[#f8f9fa] p-3">
                  <p className="text-xs font-black uppercase text-[#6b7280]">Default variant</p>
                  <p className="mt-0.5 text-xs text-[#6b7280]">
                    Every product needs at least one priced, in-stock variant — this is it. Leave size/color blank for a single-SKU product; add more
                    variants later from the Variants step.
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <FormField label="Size (optional)">
                      <input
                        className={fieldClass}
                        onChange={(e) => setForm({ ...form, defaultSize: e.target.value })}
                        placeholder="e.g. M, 150 ml"
                        value={form.defaultSize}
                      />
                    </FormField>
                    <FormField label="Color (optional)">
                      <input className={fieldClass} onChange={(e) => setForm({ ...form, defaultColor: e.target.value })} value={form.defaultColor} />
                    </FormField>
                    <FormField label="MRP (₹)">
                      <input
                        className={fieldClass}
                        onChange={(e) => setForm({ ...form, defaultMrp: e.target.value })}
                        type="number"
                        value={form.defaultMrp}
                      />
                    </FormField>
                    <FormField label="Selling price (₹)">
                      <input
                        className={fieldClass}
                        onChange={(e) => setForm({ ...form, defaultSellingPrice: e.target.value })}
                        type="number"
                        value={form.defaultSellingPrice}
                      />
                    </FormField>
                    <FormField label="Stock quantity">
                      <input
                        className={fieldClass}
                        onChange={(e) => setForm({ ...form, defaultStockQty: e.target.value })}
                        type="number"
                        value={form.defaultStockQty}
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "photos" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border border-black/[0.08]" key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="Product" className="h-full w-full object-cover" src={url} />
                    <button
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[#ef4444] text-sm font-bold text-white shadow-sm ring-1 ring-white/70 transition hover:bg-[#dc2626]"
                      onClick={() => removeImage(url)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-md border-2 border-dashed border-black/20 text-2xl font-black text-[#6b7280] transition hover:border-[#3ecf8e] hover:text-[#0f8a5f] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  +
                </button>
              </div>
              <input
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                ref={fileInputRef}
                type="file"
              />
              {uploading && <p className="text-xs text-[#6b7280]">Uploading…</p>}
            </div>
          )}

          {step === "compatibility" && (
            <div className="space-y-3">
              <label className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-[#171717]">
                <input
                  checked={form.compatUniversal}
                  className="mt-0.5"
                  onChange={(e) =>
                    setForm({ ...form, compatUniversal: e.target.checked, compatVehicleTypeId: "", compatAllBrands: true, compatBrandSelections: [] })
                  }
                  type="checkbox"
                />
                <span>
                  This product is universal
                  <span className="mt-0.5 block text-xs font-normal text-[#6b7280]">
                    Fits every vehicle type — shown in the universal section on every category page, vehicle page and product listing. Use this
                    only for truly generic accessories (phone holders, cleaning kits, etc.); most products should pick a specific vehicle type
                    below instead.
                  </span>
                </span>
              </label>

              {!form.compatUniversal && (
                <>
                  <FormField label="Vehicle type (required)">
                    <select className={fieldClass} onChange={(e) => setForm({ ...form, compatVehicleTypeId: e.target.value })} value={form.compatVehicleTypeId}>
                      <option value="">Vehicle type…</option>
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {form.compatVehicleTypeId && (
                    <>
                      <label className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                        <input checked={form.compatAllBrands} onChange={(e) => setForm({ ...form, compatAllBrands: e.target.checked, compatBrandSelections: [] })} type="checkbox" />
                        All brands of this vehicle type
                      </label>

                  {!form.compatAllBrands && (
                    <div className="space-y-2 rounded-md border border-black/[0.08] p-3">
                      <select className={fieldClass} onChange={(e) => addBrand(e.target.value)} value="">
                        <option value="">+ Add a brand…</option>
                        {brands
                          .filter((b) => !form.compatBrandSelections.some((bs) => bs.brandId === b.id))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>

                      {form.compatBrandSelections.map((bs) => {
                        const modelsForThisBrand = models.filter((m) => m.brandId === bs.brandId);
                        return (
                          <div className="rounded-md border border-black/[0.08] bg-[#f8f9fa] p-2" key={bs.brandId}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-[#171717]">{brandById.get(bs.brandId)?.name ?? bs.brandId}</span>
                              <button className="text-xs font-bold text-[#ef4444] hover:underline" onClick={() => removeBrand(bs.brandId)} type="button">
                                Remove
                              </button>
                            </div>
                            <label className="mt-1 flex items-center gap-2 text-sm font-bold text-[#171717]">
                              <input checked={bs.allModels} onChange={(e) => toggleAllModels(bs.brandId, e.target.checked)} type="checkbox" />
                              All models of this brand
                            </label>

                            {!bs.allModels && (
                              <div className="mt-2 space-y-2 pl-3">
                                <select className={fieldClass} onChange={(e) => addModel(bs.brandId, e.target.value)} value="">
                                  <option value="">+ Add a model…</option>
                                  {modelsForThisBrand
                                    .filter((m) => !bs.modelSelections.some((ms) => ms.modelId === m.id))
                                    .map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name}
                                      </option>
                                    ))}
                                </select>

                                {bs.modelSelections.map((ms) => {
                                  const variantsForThisModel = variants.filter((v) => v.modelId === ms.modelId);
                                  return (
                                    <div className="rounded-md border border-black/[0.08] bg-white p-2" key={ms.modelId}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[#171717]">{modelById.get(ms.modelId)?.name ?? ms.modelId}</span>
                                        <button className="text-xs font-bold text-[#ef4444] hover:underline" onClick={() => removeModel(bs.brandId, ms.modelId)} type="button">
                                          Remove
                                        </button>
                                      </div>
                                      <label className="mt-1 flex items-center gap-2 text-xs font-bold text-[#171717]">
                                        <input checked={ms.allVariants} onChange={(e) => toggleAllVariants(bs.brandId, ms.modelId, e.target.checked)} type="checkbox" />
                                        All variants of this model
                                      </label>
                                      {!ms.allVariants && (
                                        <div className="mt-1 flex flex-wrap gap-2 pl-3">
                                          {variantsForThisModel.map((v) => (
                                            <label className="flex items-center gap-1 text-xs font-bold text-[#171717]" key={v.id}>
                                              <input checked={ms.variantIds.includes(v.id)} onChange={() => toggleVariant(bs.brandId, ms.modelId, v.id)} type="checkbox" />
                                              {v.name}
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
                </>
              )}
            </div>
          )}

          {step === "variants" &&
            (form.id ? (
              <SellerProductVariantsEditor onCountChange={setVariantCount} productId={form.id} />
            ) : (
              <p className="text-sm text-[#6b7280]">Save the product first (Basic details + Photos + Compatibility) to add size/color variants.</p>
            ))}

          {step === "review" && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ReadinessDot tone={basicReady ? "green" : "amber"} />
                <span className="font-bold text-[#171717]">Basic details</span>
                {!basicReady && (
                  <span className="text-[#6b7280]">
                    — title and category are required{!form.id && ", plus the default variant's MRP and selling price"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ReadinessDot tone={photosReady ? "green" : "amber"} />
                <span className="font-bold text-[#171717]">Photos</span>
                {!photosReady && <span className="text-[#6b7280]">— add at least one photo</span>}
              </div>
              <div className="flex items-center gap-2">
                <ReadinessDot tone={compatReady ? "green" : "amber"} />
                <span className="font-bold text-[#171717]">Compatibility</span>
                {!compatReady && <span className="text-[#6b7280]">— choose what this fits</span>}
              </div>
              <div className="flex items-center gap-2">
                <ReadinessDot tone={variantCount > 0 ? "green" : "gray"} />
                <span className="font-bold text-[#171717]">Variants</span>
                <span className="text-[#6b7280]">— {variantCount} total (the default one, plus any extra sizes/colors added)</span>
              </div>
              {!form.id && <p className="mt-3 text-[#6b7280]">Save the product before you can publish it.</p>}
              {form.id && !reviewReady && <p className="mt-3 text-[#6b7280]">Finish the sections above before publishing.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
