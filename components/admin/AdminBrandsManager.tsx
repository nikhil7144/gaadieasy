"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import { slugify } from "@/lib/utils/format";
import type { Brand, VehicleCategory } from "@/types/automobile";

export function AdminBrandsManager({ brands, categories }: { brands: Brand[]; categories: VehicleCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [editingBrandId, setEditingBrandId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function resetForm() {
    setName("");
    setSlug("");
    setLogoUrl("");
    setCategoryIds([]);
    setFeatured(false);
    setActive(true);
    setEditingBrandId("");
    setLogoFile(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const firstCategorySlug = categories.find((category) => category.id === categoryIds[0])?.slug;
      const payload = {
        name,
        slug: slug || slugify(firstCategorySlug ? `${name} ${firstCategorySlug}` : name),
        logoUrl,
        categoryIds,
        active,
        featured,
      };
      if (editingBrandId) {
        await patchAdminJson("/api/admin/brands", { id: editingBrandId, ...payload });
      } else {
        await postAdminJson("/api/admin/brands", payload);
      }
      resetForm();
      setMessage(editingBrandId ? "Brand updated." : "Brand saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save brand");
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  function beginEdit(brand: Brand) {
    setEditingBrandId(brand.id);
    setName(brand.name);
    setSlug(brand.slug);
    setLogoUrl(brand.logoUrl ?? "");
    setCategoryIds(brand.categoryIds ?? []);
    setFeatured(brand.featured);
    setActive(brand.active);
    setLogoFile(null);
    setMessage("");
    setError("");
  }

  async function handleLogoUpload() {
    if (!logoFile) return;

    setUploadingLogo(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", logoFile);
      formData.set("brandSlug", slug || slugify(name || "brand"));

      const response = await fetch("/api/admin/brand-logo", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to upload brand logo");

      setLogoUrl(payload.url);
      setLogoFile(null);
      setMessage("Logo uploaded. Save the brand to keep it.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload brand logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteBrand(brand: Brand) {
    if (!window.confirm(`Delete ${brand.name}? This only works when the brand has no linked models or leads.`)) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await deleteAdminJson("/api/admin/brands", { id: brand.id });
      if (editingBrandId === brand.id) resetForm();
      setMessage("Brand deleted.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete brand");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Brand master</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">{editingBrandId ? "Edit brand" : "Create brand"}</h1>
        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <input className={adminFieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Brand name" required />
          <div>
            <div className="mb-2 text-xs font-black uppercase text-slate-500">Brand category</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  className={`rounded-md border px-3 py-2 text-sm font-bold ${
                    categoryIds.includes(category.id)
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                  key={category.id}
                >
                  <input
                    className="mr-2"
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>
          <input className={adminFieldClass} value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug auto-generates with category if blank" />
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 text-xs font-black uppercase text-slate-500">Brand logo</div>
            {logoUrl ? (
              <div className="mb-3 flex items-center gap-3 rounded-md bg-slate-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-10 w-16 rounded object-contain" src={logoUrl} alt={`${name || "Brand"} logo`} />
                <div className="min-w-0 flex-1 truncate text-xs font-bold text-slate-500">{logoUrl}</div>
              </div>
            ) : null}
            <input className={adminFieldClass} value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="Logo URL, or upload below" />
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className={adminFieldClass}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
              />
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!logoFile || uploadingLogo}
                onClick={handleLogoUpload}
                type="button"
              >
                <Upload size={16} /> {uploadingLogo ? "Uploading" : "Upload"}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            Active brand
          </label>
          {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
              {editingBrandId ? <Save size={16} /> : <Plus size={16} />} {saving ? "Saving" : editingBrandId ? "Update brand" : "Save brand"}
            </button>
            {editingBrandId ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-emerald-300"
                onClick={resetForm}
                type="button"
              >
                <X size={16} /> Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Existing brands</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {brands.map((brand) => (
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]" key={brand.id}>
              <div>
                <div className="font-black text-slate-950">{brand.name}</div>
                <div className="text-xs font-bold text-slate-500">/{brand.slug}</div>
                {brand.logoUrl ? (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="h-8 w-16 rounded bg-slate-50 object-contain" src={brand.logoUrl} alt={`${brand.name} logo`} />
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(brand.categoryIds ?? []).map((categoryId) => {
                    const category = categories.find((item) => item.id === categoryId);
                    return category ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800" key={categoryId}>
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-xs font-black">
                {brand.featured ? <span className="rounded-full bg-lime-100 px-2 py-1 text-emerald-800">Featured</span> : null}
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{brand.active ? "Active" : "Inactive"}</span>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                  onClick={() => beginEdit(brand)}
                  type="button"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 hover:border-red-300"
                  onClick={() => handleDeleteBrand(brand)}
                  type="button"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
