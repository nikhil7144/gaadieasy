"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson, Plus } from "lucide-react";
import { adminFieldClass, parseFaqLines, postAdminJson, splitLines } from "@/components/admin/admin-form-utils";
import { slugify } from "@/lib/utils/format";
import type { Brand, VehicleCategory, VehicleModel } from "@/types/automobile";

export function AdminModelsManager({
  brands,
  categories,
  models,
}: {
  brands: Brand[];
  categories: VehicleCategory[];
  models: VehicleModel[];
}) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [loaderSize, setLoaderSize] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [overview, setOverview] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [faq, setFaq] = useState("");
  const [featured, setFeatured] = useState(false);
  const [createdModel, setCreatedModel] = useState<VehicleModel | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [importBrandId, setImportBrandId] = useState(brands[0]?.id ?? "");
  const [importCategoryId, setImportCategoryId] = useState(categories[0]?.id ?? "");
  const [importJson, setImportJson] = useState("");
  const [importResult, setImportResult] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setCreatedModel(null);

    try {
      const payload = await postAdminJson("/api/admin/models", {
        brandId,
        categoryId,
        name,
        slug: slug || slugify(name),
        bodyType,
        loaderSize,
        imageUrl,
        overview,
        pros: splitLines(pros),
        cons: splitLines(cons),
        faq: parseFaqLines(faq),
        active: true,
        featured,
      });
      setCreatedModel(payload.model);
      setName("");
      setSlug("");
      setBodyType("");
      setLoaderSize("");
      setImageUrl("");
      setOverview("");
      setPros("");
      setCons("");
      setFaq("");
      setFeatured(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save model");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImporting(true);
    setImportResult("");
    setImportError("");

    try {
      const parsed = JSON.parse(importJson) as Record<string, unknown>;
      const payload = {
        brandId: importBrandId,
        categoryId: importCategoryId,
        ...parsed,
      };
      const result = await postAdminJson("/api/admin/model-import", payload);
      setImportResult(`${result.model.name} imported with ${result.variants.length} variant${result.variants.length === 1 ? "" : "s"}.`);
      setImportJson("");
      router.refresh();
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "Unable to import JSON");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Model master</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Create model</h1>
        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <select className={adminFieldClass} value={brandId} onChange={(event) => setBrandId(event.target.value)} required>
            {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
          </select>
          <select className={adminFieldClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          <input className={adminFieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Model name" required />
          <input className={adminFieldClass} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug auto-generates if blank" />
          <input className={adminFieldClass} value={bodyType} onChange={(event) => setBodyType(event.target.value)} placeholder="SUV, Cruiser, Scooter..." required />
          <select className={adminFieldClass} value={loaderSize} onChange={(event) => setLoaderSize(event.target.value)}>
            <option value="">Loader / truck size optional</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
          <input className={adminFieldClass} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Hero image URL until upload is wired" />
          <textarea className={`${adminFieldClass} min-h-24 py-3`} value={overview} onChange={(event) => setOverview(event.target.value)} placeholder="Overview" />
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={pros} onChange={(event) => setPros(event.target.value)} placeholder="Pros, one per line" />
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={cons} onChange={(event) => setCons(event.target.value)} placeholder="Cons, one per line" />
          <textarea
            className={`${adminFieldClass} min-h-24 py-3`}
            value={faq}
            onChange={(event) => setFaq(event.target.value)}
            placeholder="FAQs, one per line. Format: Question | Answer"
          />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            Featured model
          </label>
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          {createdModel ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-sm font-black text-emerald-900">{createdModel.name} created.</div>
              <Link className="mt-2 inline-flex rounded-full bg-lime-300 px-3 py-2 text-xs font-black text-slate-950" href={`/admin/variants?modelId=${createdModel.id}`}>
                Create first variant
              </Link>
            </div>
          ) : null}
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
            <Plus size={16} /> {saving ? "Saving" : "Save model"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Existing models</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {models.map((model) => (
            <Link className="rounded-lg border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50" href={`/admin/variants?modelId=${model.id}`} key={model.id}>
              <div className="flex flex-wrap gap-2 text-xs font-black uppercase text-emerald-700">
                <span>{model.bodyType}</span>
                {model.loaderSize ? <span className="rounded-full bg-lime-100 px-2 text-lime-900">{model.loaderSize}</span> : null}
              </div>
              <div className="mt-1 font-black text-slate-950">{model.name}</div>
              <div className="mt-1 text-xs font-bold text-slate-500">/{model.slug}</div>
              {model.faq?.length ? <div className="mt-2 text-xs font-bold text-emerald-700">{model.faq.length} FAQ items</div> : null}
            </Link>
          ))}
        </div>
      </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-lime-300 text-slate-950">
            <FileJson size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">Bulk import</p>
            <h2 className="text-2xl font-black text-slate-950">Create model with variants from JSON</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Paste ChatGPT-generated model JSON here. Brand and category are selected above; extra JSON keys like categorySlug are harmless.
              If the model or variant already exists, the import updates it.
              For bikes and scooters, use <strong>bike</strong> and <strong>ev</strong> specification groups instead of car-only interior/exterior fields.
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleImport}>
          <div className="grid gap-3 md:grid-cols-2">
            <select className={adminFieldClass} value={importBrandId} onChange={(event) => setImportBrandId(event.target.value)} required>
              {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
            </select>
            <select className={adminFieldClass} value={importCategoryId} onChange={(event) => setImportCategoryId(event.target.value)} required>
              {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
          </div>
          <textarea
            className={`${adminFieldClass} min-h-80 py-3 font-mono text-xs leading-5`}
            value={importJson}
            onChange={(event) => setImportJson(event.target.value)}
            placeholder={`{\n  "model": {\n    "name": "450X",\n    "slug": "450x",\n    "bodyType": "Electric Scooter",\n    "overview": "Premium electric scooter for city commuting.",\n    "pros": ["Quick acceleration", "Connected dashboard"],\n    "cons": ["Premium price"],\n    "faq": [\n      { "question": "What range can I expect?", "answer": "Real-world range depends on ride mode and traffic." },\n      { "question": "Can I charge at home?", "answer": "Yes, home charging is supported with the supplied charger." }\n    ],\n    "featured": true,\n    "active": true\n  },\n  "variants": [\n    {\n      "name": "450X 3.7 kWh",\n      "exShowroomPrice": 155000,\n      "fuelType": "Electric",\n      "transmission": "Automatic",\n      "engineCapacity": "3.7 kWh battery",\n      "mileage": "150 km range",\n      "seatingCapacity": 2,\n      "colors": ["Space Grey", "Still White"],\n      "features": ["Navigation", "Ride modes", "Reverse assist"],\n      "specifications": {\n        "engine": {\n          "maxPower": "6.4 kW",\n          "maxTorque": "26 Nm",\n          "driveType": "Belt drive",\n          "emissionNorm": "Zero emission"\n        },\n        "ev": {\n          "batteryCapacity": "3.7 kWh",\n          "claimedRange": "150 km",\n          "realWorldRange": "110-120 km",\n          "chargerType": "Portable and fast charger",\n          "chargingTime": "0-80% in 4 hr 30 min"\n        },\n        "bike": {\n          "brakeType": "Disc brakes with CBS",\n          "suspensionType": "Telescopic front, monoshock rear",\n          "wheelSize": "12-inch alloy wheels",\n          "seatHeight": "780 mm",\n          "kerbWeight": "111.6 kg",\n          "ridingModes": "SmartEco, Eco, Ride, Sport"\n        }\n      }\n    }\n  ]\n}`}
            required
          />
          {importResult ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{importResult}</p> : null}
          {importError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{importError}</p> : null}
          <button className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700" disabled={importing}>
            <FileJson size={16} /> {importing ? "Importing" : "Import model and variants"}
          </button>
        </form>
      </section>
    </div>
  );
}
