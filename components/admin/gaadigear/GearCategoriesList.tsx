"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { GearCategory, VehicleType } from "@/types/automobile";

async function uploadToStorage(file: File, prefix: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("bucket", "gear-product-images");
  body.append("prefix", prefix);
  const response = await fetch("/api/admin/upload-to-storage", { method: "POST", body });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return String(payload.url);
}

type FormState = {
  id?: string;
  name: string;
  slug: string;
  level: 1 | 2;
  parentId: string;
  applicableVehicleTypes: string[];
  sortOrder: number;
  isActive: boolean;
  imageUrl: string;
  commissionPct: number;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  level: 1,
  parentId: "",
  applicableVehicleTypes: [],
  sortOrder: 0,
  isActive: true,
  imageUrl: "",
  commissionPct: 7,
};

export function GearCategoriesList({ categories, vehicleTypes }: { categories: GearCategory[]; vehicleTypes: VehicleType[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | "1" | "2">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const vehicleTypeName = useMemo(() => new Map(vehicleTypes.map((v) => [v.id, v.name])), [vehicleTypes]);
  const l1Options = useMemo(() => categories.filter((c) => c.level === 1), [categories]);

  async function uploadCategoryImage(file: File) {
    setUploadingImage(true);
    setError("");
    try {
      const url = await uploadToStorage(file, "categories");
      setForm((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  const rows = useMemo(() => {
    return categories
      .filter((c) => (levelFilter === "all" ? true : c.level === Number(levelFilter)))
      .filter((c) => (statusFilter === "all" ? true : statusFilter === "active" ? c.isActive : !c.isActive))
      .filter((c) => (search.trim() ? c.name.toLowerCase().includes(search.trim().toLowerCase()) || c.slug.includes(search.trim().toLowerCase()) : true))
      .sort((a, b) => a.level - b.level || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, levelFilter, statusFilter, search]);

  function startAdd() {
    setError("");
    setForm({ ...emptyForm });
  }

  function startEdit(category: GearCategory) {
    setError("");
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      level: category.level as 1 | 2,
      parentId: category.parentId ?? "",
      applicableVehicleTypes: category.applicableVehicleTypes,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      imageUrl: category.imageUrl ?? "",
      commissionPct: category.commissionPct,
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        level: form.level,
        parentId: form.level === 2 ? form.parentId || undefined : undefined,
        applicableVehicleTypes: form.applicableVehicleTypes,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        imageUrl: form.imageUrl || undefined,
        commissionPct: form.commissionPct,
      };
      if (form.id) {
        await patchAdminJson("/api/admin/gaadigear/categories", { id: form.id, ...payload });
      } else {
        await postAdminJson("/api/admin/gaadigear/categories", payload);
      }
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save category");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteAdminJson("/api/admin/gaadigear/categories", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete category");
    }
  }

  function toggleVehicleType(id: string) {
    if (!form) return;
    const next = form.applicableVehicleTypes.includes(id)
      ? form.applicableVehicleTypes.filter((v) => v !== id)
      : [...form.applicableVehicleTypes, id];
    setForm({ ...form, applicableVehicleTypes: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-black text-slate-950">GaadiGear categories</h1>
        <button className="text-sm font-bold text-emerald-700 hover:underline" onClick={startAdd} type="button">
          + Add category
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${adminFieldClass} w-56`}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or slug"
          value={search}
        />
        <select className={adminFieldClass} onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)} value={levelFilter}>
          <option value="all">All levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
        </select>
        <select className={adminFieldClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {form && (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <input className={adminFieldClass} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" value={form.name} />
            <input className={adminFieldClass} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug (auto if blank)" value={form.slug} />
            <select className={adminFieldClass} onChange={(e) => setForm({ ...form, level: Number(e.target.value) as 1 | 2, parentId: "" })} value={form.level}>
              <option value={1}>Level 1</option>
              <option value={2}>Level 2</option>
            </select>
            {form.level === 2 && (
              <select className={adminFieldClass} onChange={(e) => setForm({ ...form, parentId: e.target.value })} value={form.parentId}>
                <option value="">Parent category…</option>
                {l1Options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              placeholder="Sort order"
              type="number"
              value={form.sortOrder}
            />
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} type="checkbox" />
              Active
            </label>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">Commission % (applied above ₹700 unit price)</p>
              <input
                className={adminFieldClass}
                min={0}
                max={100}
                onChange={(e) => setForm({ ...form, commissionPct: Number(e.target.value) || 0 })}
                step="0.1"
                type="number"
                value={form.commissionPct}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-500">Category image (optional — shown as a tile on the homepage)</p>
              <div className="flex items-center gap-2">
                <button
                  className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={uploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                >
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Category" className="h-full w-full object-cover" src={form.imageUrl} />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500">{uploadingImage ? "…" : "+ Upload"}</span>
                  )}
                </button>
                {form.imageUrl && (
                  <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => setForm({ ...form, imageUrl: "" })} type="button">
                    Remove
                  </button>
                )}
              </div>
              <input
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => e.target.files?.[0] && uploadCategoryImage(e.target.files[0])}
                ref={imageInputRef}
                type="file"
              />
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-black uppercase text-slate-500">Applicable vehicle types</p>
            <div className="flex flex-wrap gap-3">
              {vehicleTypes.map((vt) => (
                <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700" key={vt.id}>
                  <input checked={form.applicableVehicleTypes.includes(vt.id)} onChange={() => toggleVehicleType(vt.id)} type="checkbox" />
                  {vt.name}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}

          <div className="mt-3 flex gap-3">
            <button className="text-sm font-bold text-emerald-700 hover:underline disabled:opacity-50" disabled={saving} onClick={save} type="button">
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="text-sm font-bold text-slate-500 hover:underline" onClick={() => setForm(null)} type="button">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">No categories match this filter.</p>
        ) : (
          <div>
            {rows.map((c) => (
              <div className="group flex items-center gap-3 border-b border-slate-200 py-2 text-sm" key={c.id}>
                <div className="flex-1" style={{ paddingLeft: c.level === 2 ? 20 : 0 }}>
                  <span className="font-bold text-slate-950">{c.level === 2 ? "└ " : ""}{c.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{c.slug}</span>
                </div>
                <div className="w-56 truncate text-xs text-slate-500">
                  {c.applicableVehicleTypes.map((id) => vehicleTypeName.get(id)).filter(Boolean).join(", ") || "—"}
                </div>
                <div className="w-16 shrink-0 text-xs font-bold text-slate-600">{c.commissionPct}%</div>
                <div className="flex w-24 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className="text-xs text-slate-600">{c.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex w-32 shrink-0 justify-end gap-3 opacity-0 group-hover:opacity-100">
                  <button className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => startEdit(c)} type="button">
                    Edit
                  </button>
                  <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => remove(c.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
