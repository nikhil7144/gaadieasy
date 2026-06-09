"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { adminFieldClass, deleteAdminJson, parseOptionalJson, patchAdminJson, postAdminJson, splitLines } from "@/components/admin/admin-form-utils";
import { slugify } from "@/lib/utils/format";
import type { SpecificationGroup, VehicleCategory, VehicleMedia, VehicleModel, VehicleVariant } from "@/types/automobile";

type SpecField = {
  key: string;
  label: string;
  placeholder?: string;
};

type SpecSection = {
  title: string;
  description: string;
  group: "engine" | "dimensions" | "interior" | "exterior" | "safety" | "ev" | "commercial" | "bike";
  fields: SpecField[];
};

const baseSections: SpecSection[] = [
  {
    title: "Engine and transmission",
    description: "Powertrain, torque, drive and emission details.",
    group: "engine",
    fields: [
      { key: "engine.maxPower", label: "Max power", placeholder: "114 bhp / 6 kW" },
      { key: "engine.maxTorque", label: "Max torque", placeholder: "250 Nm" },
      { key: "engine.cylinders", label: "Cylinders", placeholder: "4 cylinders" },
      { key: "engine.driveType", label: "Drive type", placeholder: "Front-wheel drive / Belt drive" },
      { key: "engine.emissionNorm", label: "Emission norm", placeholder: "BS6 Phase 2 / Zero emission" },
    ],
  },
  {
    title: "Dimensions and capacity",
    description: "Physical dimensions and storage/capacity information.",
    group: "dimensions",
    fields: [
      { key: "dimensions.length", label: "Length", placeholder: "4330 mm" },
      { key: "dimensions.width", label: "Width", placeholder: "1790 mm" },
      { key: "dimensions.height", label: "Height", placeholder: "1635 mm" },
      { key: "dimensions.wheelbase", label: "Wheelbase", placeholder: "2610 mm" },
      { key: "dimensions.bootSpace", label: "Boot / storage / cargo", placeholder: "433 litres" },
      { key: "dimensions.groundClearance", label: "Ground clearance", placeholder: "190 mm" },
    ],
  },
  {
    title: "Safety specification",
    description: "Safety equipment, braking, camera and rating information.",
    group: "safety",
    fields: [
      { key: "safety.airbags", label: "Airbags", placeholder: "6 airbags" },
      { key: "safety.abs", label: "ABS / braking", placeholder: "ABS with EBD" },
      { key: "safety.esc", label: "Stability control", placeholder: "Electronic stability control" },
      { key: "safety.camera", label: "Camera", placeholder: "Rear camera" },
      { key: "safety.sensors", label: "Sensors", placeholder: "Front and rear parking sensors" },
      { key: "safety.rating", label: "Safety rating", placeholder: "5-star safety positioning" },
    ],
  },
];

const carInteriorSection: SpecSection = {
  title: "Interior specification",
  description: "Cabin, dashboard, infotainment and seating details.",
  group: "interior",
  fields: [
    { key: "interior.upholstery", label: "Upholstery", placeholder: "Leatherette seats" },
    { key: "interior.dashboard", label: "Dashboard / console", placeholder: "Dual-tone dashboard" },
    { key: "interior.infotainment", label: "Infotainment", placeholder: "10.25-inch touchscreen" },
    { key: "interior.speakers", label: "Speakers", placeholder: "8-speaker audio" },
    { key: "interior.airConditioning", label: "Air conditioning", placeholder: "Automatic climate control" },
    { key: "interior.seatFeatures", label: "Seat features", placeholder: "Ventilated front seats" },
  ],
};

const carExteriorSection: SpecSection = {
  title: "Exterior specification",
  description: "Lighting, wheels, roof and visible equipment.",
  group: "exterior",
  fields: [
    { key: "exterior.headlamps", label: "Headlamps / lighting", placeholder: "LED headlamps" },
    { key: "exterior.wheels", label: "Wheels / tyres", placeholder: "17-inch alloy wheels" },
    { key: "exterior.roofRails", label: "Roof rails / carrier", placeholder: "Functional roof rails" },
    { key: "exterior.sunroof", label: "Sunroof / open feature", placeholder: "Panoramic sunroof" },
  ],
};

const evSection: SpecSection = {
  title: "EV battery and charging",
  description: "Battery, charging and range details for EV variants.",
  group: "ev",
  fields: [
    { key: "ev.batteryCapacity", label: "Battery capacity", placeholder: "3.7 kWh" },
    { key: "ev.batteryHealth", label: "Battery health / warranty", placeholder: "8 years / 80,000 km" },
    { key: "ev.claimedRange", label: "Claimed range", placeholder: "111 km" },
    { key: "ev.realWorldRange", label: "Real-world range", placeholder: "85-95 km" },
    { key: "ev.chargerType", label: "Charger type", placeholder: "Fast charger / portable charger" },
    { key: "ev.chargingTime", label: "Charging time", placeholder: "0-80% in 4 hr 30 min" },
  ],
};

const commercialSection: SpecSection = {
  title: "Commercial and permit details",
  description: "Payload, body and usage fields for business vehicles.",
  group: "commercial",
  fields: [
    { key: "commercial.payloadCapacity", label: "Payload capacity", placeholder: "1.2 ton" },
    { key: "commercial.bodyLength", label: "Body length", placeholder: "8.2 ft" },
    { key: "commercial.axleConfiguration", label: "Axle configuration", placeholder: "4x2" },
    { key: "commercial.permitType", label: "Permit type", placeholder: "Goods carrier" },
    { key: "commercial.fleetUsageType", label: "Fleet usage", placeholder: "Last-mile delivery" },
    { key: "commercial.tyreCondition", label: "Tyre details", placeholder: "Tubeless radial tyres" },
  ],
};

const bikeSection: SpecSection = {
  title: "Two-wheeler details",
  description: "Riding, braking, suspension and wheel details.",
  group: "bike",
  fields: [
    { key: "bike.brakeType", label: "Brake type", placeholder: "Dual-channel ABS" },
    { key: "bike.suspensionType", label: "Suspension", placeholder: "Telescopic front forks" },
    { key: "bike.wheelSize", label: "Wheel size", placeholder: "19-inch front / 18-inch rear" },
    { key: "bike.seatHeight", label: "Seat height", placeholder: "805 mm" },
    { key: "bike.kerbWeight", label: "Kerb weight", placeholder: "195 kg" },
    { key: "bike.ridingModes", label: "Riding modes", placeholder: "Eco, Ride, Sport" },
  ],
};

function setNestedValue(target: Record<string, unknown>, path: string, value: string) {
  const [group, field] = path.split(".");
  target[group] = {
    ...((target[group] as Record<string, string> | undefined) ?? {}),
    [field]: value,
  };
}

function specValue(values: Record<string, string>, key: string) {
  return values[key] ?? "";
}

function parseColorLines(value: string) {
  const colorHexMap: Record<string, string> = {};
  const colors = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, hex] = item.split("|").map((part) => part.trim());
      if (name && hex) colorHexMap[name] = hex;
      return name;
    })
    .filter(Boolean);

  return { colors, colorHexMap };
}

function formatColorLines(specifications: VehicleVariant["specifications"]) {
  const colorHexMap = specifications.colorHexMap ?? {};
  return (specifications.colors ?? []).map((color) => `${color}${colorHexMap[color] ? ` | ${colorHexMap[color]}` : ""}`).join("\n");
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item)) : [];
}

function nestedString(specifications: Record<string, unknown>, key: string) {
  const [group, field] = key.split(".");
  const section = specifications[group];
  if (!section || typeof section !== "object" || Array.isArray(section)) return "";
  const value = (section as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

function valuesFromSpecifications(sections: SpecSection[], specifications: Record<string, unknown>) {
  const values: Record<string, string> = {};
  sections.forEach((section) => {
    section.fields.forEach((field) => {
      const value = nestedString(specifications, field.key);
      if (value) values[field.key] = value;
    });
  });
  return values;
}

function isCommercialCategory(category?: VehicleCategory) {
  return category?.slug.includes("commercial") ?? false;
}

function isBikeCategory(category?: VehicleCategory) {
  const slug = category?.slug ?? "";
  return slug.includes("bike") || slug.includes("scooter");
}

function isCarLikeCategory(category?: VehicleCategory) {
  const slug = category?.slug ?? "";
  return !isBikeCategory(category) && !isCommercialCategory(category) && !slug.includes("passenger-ev");
}

export function AdminVariantsManager({
  categories,
  models,
  variants,
  media,
  initialModelId,
}: {
  categories: VehicleCategory[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  media: VehicleMedia[];
  initialModelId?: string;
}) {
  const router = useRouter();
  const [modelId, setModelId] = useState(initialModelId || models[0]?.id || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [exShowroomPrice, setExShowroomPrice] = useState("");
  const [fuelType, setFuelType] = useState("Petrol");
  const [transmission, setTransmission] = useState("Manual");
  const [engineCapacity, setEngineCapacity] = useState("");
  const [mileage, setMileage] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("5");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isDefault, setIsDefault] = useState(false);
  const [colors, setColors] = useState("");
  const [features, setFeatures] = useState("");
  const [highlights, setHighlights] = useState("");
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [specJson, setSpecJson] = useState("");
  const [editingVariantId, setEditingVariantId] = useState("");
  const [editModelId, setEditModelId] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editExShowroomPrice, setEditExShowroomPrice] = useState("");
  const [editFuelType, setEditFuelType] = useState<VehicleVariant["fuelType"]>("Petrol");
  const [editTransmission, setEditTransmission] = useState<VehicleVariant["transmission"]>("Manual");
  const [editEngineCapacity, setEditEngineCapacity] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editSeatingCapacity, setEditSeatingCapacity] = useState("5");
  const [editDisplayOrder, setEditDisplayOrder] = useState("0");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editColors, setEditColors] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editHighlights, setEditHighlights] = useState("");
  const [editSpecValues, setEditSpecValues] = useState<Record<string, string>>({});
  const [editSpecJson, setEditSpecJson] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadColorName, setUploadColorName] = useState("");
  const [uploadMediaType, setUploadMediaType] = useState<VehicleMedia["mediaType"]>("exterior");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadDisplayOrder, setUploadDisplayOrder] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const extraSpecs = parseOptionalJson(specJson);
      const colorData = parseColorLines(colors);
      const selectedSections = buildSections();
      const nestedSpecs: Record<string, unknown> = {};
      const groups: SpecificationGroup[] = selectedSections
        .map((section) => {
          const fields = section.fields
            .map((field) => {
              const value = specValue(specValues, field.key);
              if (value) setNestedValue(nestedSpecs, field.key, value);
              return { label: field.label, value };
            })
            .filter((field) => field.value);

          return {
            title: section.title,
            description: section.description,
            fields,
          };
        })
        .filter((group) => group.fields.length);

      await postAdminJson("/api/admin/variants", {
        modelId,
        name,
        slug: slug || slugify(name),
        exShowroomPrice,
        fuelType,
        transmission,
        engineCapacity,
        mileage,
        seatingCapacity,
        displayOrder,
        isDefault,
        specifications: {
          ...extraSpecs,
          ...nestedSpecs,
          engine: {
            ...((nestedSpecs.engine as Record<string, unknown> | undefined) ?? {}),
            displacement: engineCapacity,
          },
          colors: colorData.colors,
          colorHexMap: colorData.colorHexMap,
          features: splitLines(features),
          highlights: splitLines(highlights),
        },
        specificationGroups: groups,
        active: true,
      });
      setName("");
      setSlug("");
      setExShowroomPrice("");
      setEngineCapacity("");
      setMileage("");
      setSeatingCapacity("5");
      setDisplayOrder("0");
      setIsDefault(false);
      setColors("");
      setFeatures("");
      setHighlights("");
      setSpecValues({});
      setSpecJson("");
      setMessage("Variant saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save variant");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(variant: VehicleVariant) {
    const editModel = models.find((model) => model.id === variant.modelId);
    const editCategory = categories.find((category) => category.id === editModel?.categoryId);
    const editSections = buildSectionsFor(variant.fuelType, editCategory);
    setEditingVariantId(variant.id);
    setEditModelId(variant.modelId);
    setEditName(variant.name);
    setEditSlug(variant.slug);
    setEditExShowroomPrice(String(variant.exShowroomPrice));
    setEditFuelType(variant.fuelType);
    setEditTransmission(variant.transmission);
    setEditEngineCapacity(variant.engineCapacity);
    setEditMileage(variant.mileage);
    setEditSeatingCapacity(String(variant.seatingCapacity));
    setEditDisplayOrder(String(variant.displayOrder ?? 0));
    setEditIsDefault(Boolean(variant.isDefault));
    setEditColors(formatColorLines(variant.specifications));
    setEditFeatures(stringList(variant.specifications.features).join("\n"));
    setEditHighlights(stringList(variant.specifications.highlights).join("\n"));
    setEditSpecValues(valuesFromSpecifications(editSections, variant.specifications as Record<string, unknown>));
    setEditSpecJson(JSON.stringify(variant.specifications, null, 2));
    setEditActive(variant.active);
    setUploadColorName(variant.specifications.colors?.[0] ?? "");
    setUploadAlt(`${variant.name} photo`);
    setMessage("");
    setError("");
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const variant = variants.find((item) => item.id === editingVariantId);
    if (!variant) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const colorData = parseColorLines(editColors);
      const extraSpecs = parseOptionalJson(editSpecJson);
      const editModel = models.find((model) => model.id === editModelId);
      const editCategory = categories.find((category) => category.id === editModel?.categoryId);
      const selectedSections = buildSectionsFor(editFuelType, editCategory);
      const nestedSpecs: Record<string, unknown> = {};
      const groups: SpecificationGroup[] = selectedSections
        .map((section) => {
          const fields = section.fields
            .map((field) => {
              const value = specValue(editSpecValues, field.key);
              if (value) setNestedValue(nestedSpecs, field.key, value);
              return { label: field.label, value };
            })
            .filter((field) => field.value);

          return {
            title: section.title,
            description: section.description,
            fields,
          };
        })
        .filter((group) => group.fields.length);

      await patchAdminJson("/api/admin/variants", {
        id: variant.id,
        modelId: editModelId,
        name: editName,
        slug: editSlug || slugify(editName),
        exShowroomPrice: editExShowroomPrice,
        fuelType: editFuelType,
        transmission: editTransmission,
        engineCapacity: editEngineCapacity,
        mileage: editMileage,
        seatingCapacity: editSeatingCapacity,
        displayOrder: editDisplayOrder,
        isDefault: editIsDefault,
        specifications: {
          ...extraSpecs,
          ...nestedSpecs,
          engine: {
            ...((nestedSpecs.engine as Record<string, unknown> | undefined) ?? {}),
            displacement: editEngineCapacity,
          },
          colors: colorData.colors,
          colorHexMap: colorData.colorHexMap,
          features: splitLines(editFeatures),
          highlights: splitLines(editHighlights),
        },
        specificationGroups: groups,
        active: editActive,
      });
      setMessage("Variant updated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update variant");
    } finally {
      setSaving(false);
    }
  }

  async function handleMediaUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const variant = variants.find((item) => item.id === editingVariantId);
    if (!variant || !uploadFile) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("modelId", variant.modelId);
      formData.set("variantId", variant.id);
      formData.set("colorName", uploadColorName);
      formData.set("mediaType", uploadMediaType);
      formData.set("alt", uploadAlt);
      formData.set("displayOrder", uploadDisplayOrder);

      const response = await fetch("/api/admin/vehicle-media", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to upload image");

      setUploadFile(null);
      setMessage("Variant image uploaded.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload image");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariant(variant: VehicleVariant) {
    if (!window.confirm(`Delete ${variant.name}? This removes the variant and its media records.`)) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAdminJson("/api/admin/variants", { id: variant.id });
      if (editingVariantId === variant.id) setEditingVariantId("");
      setMessage("Variant deleted.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete variant");
    } finally {
      setSaving(false);
    }
  }

  const modelVariants = variants.filter((variant) => variant.modelId === modelId);
  const selectedModel = models.find((model) => model.id === modelId);
  const selectedCategory = categories.find((category) => category.id === selectedModel?.categoryId);
  const editModel = models.find((model) => model.id === editModelId);
  const editCategory = categories.find((category) => category.id === editModel?.categoryId);
  const editSections = buildSectionsFor(editFuelType, editCategory);

  function buildSectionsFor(selectedFuelType: VehicleVariant["fuelType"] | string, category?: VehicleCategory) {
    const sections = [...baseSections];
    if (isCarLikeCategory(category)) sections.splice(2, 0, carInteriorSection, carExteriorSection);
    if (selectedFuelType === "Electric" || category?.slug.includes("ev")) sections.push(evSection);
    if (isBikeCategory(category)) sections.push(bikeSection);
    if (isCommercialCategory(category)) sections.push(commercialSection);
    return sections;
  }

  function buildSections() {
    return buildSectionsFor(fuelType, selectedCategory);
  }

  function updateSpecValue(key: string, value: string) {
    setSpecValues((current) => ({ ...current, [key]: value }));
  }

  function updateEditSpecValue(key: string, value: string) {
    setEditSpecValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Variant master</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Create variant</h1>
        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <select className={adminFieldClass} value={modelId} onChange={(event) => setModelId(event.target.value)} required>
            {models.map((model) => <option value={model.id} key={model.id}>{model.name}</option>)}
          </select>
          <input className={adminFieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Variant name" required />
          <input className={adminFieldClass} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug auto-generates if blank" />
          <input className={adminFieldClass} type="number" value={exShowroomPrice} onChange={(event) => setExShowroomPrice(event.target.value)} placeholder="Ex-showroom price" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={adminFieldClass} value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
              {["Petrol", "Diesel", "CNG", "Hybrid", "Electric"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className={adminFieldClass} value={transmission} onChange={(event) => setTransmission(event.target.value)}>
              {["Manual", "Automatic", "AMT", "CVT", "DCT"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <input className={adminFieldClass} value={engineCapacity} onChange={(event) => setEngineCapacity(event.target.value)} placeholder="1493 cc / 3.7 kWh" required />
          <input className={adminFieldClass} value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="19.1 km/l / 111 km range" required />
          <input className={adminFieldClass} type="number" value={seatingCapacity} onChange={(event) => setSeatingCapacity(event.target.value)} placeholder="Seats" required />
          <input className={adminFieldClass} type="number" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} placeholder="Display order" />
          <label className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
            Make default variant for this model
          </label>
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Colors, one per line. Use Atlas White | #f8fafc for exact swatch." />
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={features} onChange={(event) => setFeatures(event.target.value)} placeholder="Features, one per line" />
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={highlights} onChange={(event) => setHighlights(event.target.value)} placeholder="Highlights, one per line" />

          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <div className="text-xs font-black uppercase text-emerald-800">Category template</div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {selectedCategory?.name ?? "Select model"} fields are shown below.
              </div>
            </div>

            {buildSections().map((section) => (
              <fieldset className="rounded-lg border border-slate-200 bg-white p-3" key={section.title}>
                <legend className="px-1 text-sm font-black text-slate-950">{section.title}</legend>
                <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <label className="grid gap-1" key={field.key}>
                      <span className="text-xs font-black uppercase text-slate-500">{field.label}</span>
                      <input
                        className={adminFieldClass}
                        value={specValue(specValues, field.key)}
                        onChange={(event) => updateSpecValue(field.key, event.target.value)}
                        placeholder={field.placeholder}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <textarea className={`${adminFieldClass} min-h-24 py-3 font-mono text-xs`} value={specJson} onChange={(event) => setSpecJson(event.target.value)} placeholder='Optional JSON: {"engine":{"maxPower":"114 bhp"}}' />
          {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
            <Plus size={16} /> {saving ? "Saving" : "Save variant"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Variants for selected model</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {modelVariants.map((variant) => (
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]" key={variant.id}>
              <div>
                <div className="font-black text-slate-950">{variant.name}</div>
                <div className="text-xs font-bold text-slate-500">
                  {variant.fuelType} / {variant.transmission} / {variant.engineCapacity}
                </div>
                {variant.isDefault ? (
                  <span className="mt-2 inline-flex rounded-full bg-lime-100 px-2 py-1 text-[11px] font-black text-emerald-800">
                    Default variant
                  </span>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(variant.specifications.colors ?? []).slice(0, 4).map((color) => (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800" key={color}>
                      {color}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 text-right">
                <div className="text-sm font-black text-emerald-800">INR {variant.exShowroomPrice.toLocaleString("en-IN")}</div>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                  onClick={() => beginEdit(variant)}
                  type="button"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:border-red-300"
                  onClick={() => handleDeleteVariant(variant)}
                  type="button"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {!modelVariants.length ? <div className="p-3 text-sm font-bold text-slate-500">No variant added for this model yet.</div> : null}
        </div>

        {editingVariantId ? (
          <div className="mt-5 space-y-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <form className="grid gap-3" onSubmit={handleEditSubmit}>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Edit selected variant</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{editName}</h3>
              </div>
              <select className={adminFieldClass} value={editModelId} onChange={(event) => setEditModelId(event.target.value)} required>
                {models.map((model) => <option value={model.id} key={model.id}>{model.name}</option>)}
              </select>
              <input className={adminFieldClass} value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Variant name" required />
              <input className={adminFieldClass} value={editSlug} onChange={(event) => setEditSlug(event.target.value)} placeholder="Variant slug" required />
              <input className={adminFieldClass} type="number" value={editExShowroomPrice} onChange={(event) => setEditExShowroomPrice(event.target.value)} placeholder="Ex-showroom price" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={adminFieldClass} value={editFuelType} onChange={(event) => setEditFuelType(event.target.value as VehicleVariant["fuelType"])}>
                  {["Petrol", "Diesel", "CNG", "Hybrid", "Electric"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <select className={adminFieldClass} value={editTransmission} onChange={(event) => setEditTransmission(event.target.value as VehicleVariant["transmission"])}>
                  {["Manual", "Automatic", "AMT", "CVT", "DCT"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <input className={adminFieldClass} value={editEngineCapacity} onChange={(event) => setEditEngineCapacity(event.target.value)} placeholder="Engine / battery" required />
              <input className={adminFieldClass} value={editMileage} onChange={(event) => setEditMileage(event.target.value)} placeholder="Mileage / range" required />
              <input className={adminFieldClass} type="number" value={editSeatingCapacity} onChange={(event) => setEditSeatingCapacity(event.target.value)} placeholder="Seats" required />
              <input className={adminFieldClass} type="number" value={editDisplayOrder} onChange={(event) => setEditDisplayOrder(event.target.value)} placeholder="Display order" />
              <label className="flex items-center gap-2 rounded-md border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={editIsDefault} onChange={(event) => setEditIsDefault(event.target.checked)} />
                Make default variant for this model
              </label>
              <textarea className={`${adminFieldClass} min-h-24 py-3`} value={editColors} onChange={(event) => setEditColors(event.target.value)} placeholder="Colors, one per line. Atlas White | #f8fafc" />
              <textarea className={`${adminFieldClass} min-h-24 py-3`} value={editFeatures} onChange={(event) => setEditFeatures(event.target.value)} placeholder="Features, one per line" />
              <textarea className={`${adminFieldClass} min-h-24 py-3`} value={editHighlights} onChange={(event) => setEditHighlights(event.target.value)} placeholder="Highlights, one per line" />

              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-100 bg-white p-3">
                  <div className="text-xs font-black uppercase text-emerald-800">Edit category template</div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {editCategory?.name ?? "Select model"} fields are editable below.
                  </div>
                </div>
                {editSections.map((section) => (
                  <fieldset className="rounded-lg border border-slate-200 bg-white p-3" key={`edit-${section.title}`}>
                    <legend className="px-1 text-sm font-black text-slate-950">{section.title}</legend>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{section.description}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {section.fields.map((field) => (
                        <label className="grid gap-1" key={`edit-${field.key}`}>
                          <span className="text-xs font-black uppercase text-slate-500">{field.label}</span>
                          <input
                            className={adminFieldClass}
                            value={specValue(editSpecValues, field.key)}
                            onChange={(event) => updateEditSpecValue(field.key, event.target.value)}
                            placeholder={field.placeholder}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              <textarea className={`${adminFieldClass} min-h-32 py-3 font-mono text-xs`} value={editSpecJson} onChange={(event) => setEditSpecJson(event.target.value)} placeholder='Full specifications JSON' />
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={editActive} onChange={(event) => setEditActive(event.target.checked)} />
                Active variant
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                  <Save size={16} /> Save edit
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:border-emerald-300"
                  onClick={() => setEditingVariantId("")}
                  type="button"
                >
                  <X size={16} /> Cancel
                </button>
                {variants.find((item) => item.id === editingVariantId) ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-700 hover:border-red-300"
                    onClick={() => {
                      const variant = variants.find((item) => item.id === editingVariantId);
                      if (variant) handleDeleteVariant(variant);
                    }}
                    type="button"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : null}
              </div>
            </form>

            <form className="grid gap-3 rounded-lg bg-white p-3" onSubmit={handleMediaUpload}>
              <div>
                <p className="text-xs font-black uppercase text-emerald-700">Variant photos</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Upload image for selected color</h3>
              </div>
              <input className={adminFieldClass} type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} required />
              <input className={adminFieldClass} value={uploadColorName} onChange={(event) => setUploadColorName(event.target.value)} placeholder="Color name, e.g. Atlas White" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={adminFieldClass} value={uploadMediaType} onChange={(event) => setUploadMediaType(event.target.value as VehicleMedia["mediaType"])}>
                  {["exterior", "interior", "color", "feature"].map((item) => <option key={item}>{item}</option>)}
                </select>
                <input className={adminFieldClass} type="number" value={uploadDisplayOrder} onChange={(event) => setUploadDisplayOrder(event.target.value)} placeholder="Display order" />
              </div>
              <input className={adminFieldClass} value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} placeholder="Image alt text" />
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800" disabled={saving || !uploadFile}>
                <Upload size={16} /> Upload variant image
              </button>
              <div className="grid gap-2">
                {media.filter((item) => item.variantId === editingVariantId).map((item) => (
                  <div className="grid grid-cols-[64px_1fr] gap-3 rounded-md border border-slate-200 p-2" key={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="h-14 w-16 rounded object-cover" src={item.url} alt={item.alt} />
                    <div>
                      <div className="text-xs font-black text-slate-950">{item.alt}</div>
                      <div className="text-[11px] font-bold text-slate-500">{item.colorName ?? "No color"} / {item.mediaType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}
