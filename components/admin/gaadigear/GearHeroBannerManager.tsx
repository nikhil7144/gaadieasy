"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { GearHeroBanner } from "@/types/automobile";

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
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "Shop now",
  ctaHref: "/gaadigear/products",
  isActive: true,
  sortOrder: 0,
};

export function GearHeroBannerManager({ banners }: { banners: GearHeroBanner[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const rows = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  async function uploadHeroImage(file: File) {
    setUploadingImage(true);
    setError("");
    try {
      const url = await uploadToStorage(file, "hero-banners");
      setForm((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function startAdd() {
    setError("");
    setForm({ ...emptyForm, sortOrder: rows.length });
  }

  function startEdit(banner: GearHeroBanner) {
    setError("");
    setForm({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        imageUrl: form.imageUrl || undefined,
        ctaLabel: form.ctaLabel || undefined,
        ctaHref: form.ctaHref || undefined,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };
      if (form.id) {
        await patchAdminJson("/api/admin/gaadigear/hero-banners", { id: form.id, ...payload });
      } else {
        await postAdminJson("/api/admin/gaadigear/hero-banners", payload);
      }
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save hero banner");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this hero banner?")) return;
    try {
      await deleteAdminJson("/api/admin/gaadigear/hero-banners", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete hero banner");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-black text-slate-950">Homepage hero banner</h1>
        <button className="text-sm font-bold text-emerald-700 hover:underline" onClick={startAdd} type="button">
          + Add banner
        </button>
      </div>
      <p className="text-xs text-slate-500">
        The homepage shows the active banner with the lowest sort order. No active banner means the homepage falls back to its default text-only hero.
      </p>

      {form && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <input className={adminFieldClass} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" value={form.title} />
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Subtitle (optional)"
              value={form.subtitle}
            />
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              placeholder="Button label"
              value={form.ctaLabel}
            />
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
              placeholder="Button link, e.g. /gaadigear/products"
              value={form.ctaHref}
            />
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
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-500">Banner image</p>
            <div className="flex items-center gap-2">
              <button
                className="flex h-20 w-36 place-items-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Hero" className="h-full w-full object-cover" src={form.imageUrl} />
                ) : (
                  <span className="m-auto text-[10px] font-bold text-slate-500">{uploadingImage ? "…" : "+ Upload"}</span>
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
              onChange={(e) => e.target.files?.[0] && uploadHeroImage(e.target.files[0])}
              ref={imageInputRef}
              type="file"
            />
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

          <div className="flex gap-3">
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
          <p className="py-6 text-sm text-slate-500">No hero banners yet — the homepage shows its default text-only hero.</p>
        ) : (
          rows.map((banner) => (
            <div className="group flex items-center gap-3 border-b border-slate-200 py-2 text-sm" key={banner.id}>
              <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                {banner.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={banner.title} className="h-full w-full object-cover" src={banner.imageUrl} />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-950">{banner.title}</span>
              </div>
              <div className="flex w-20 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${banner.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-600">{banner.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex w-32 shrink-0 justify-end gap-3 opacity-0 group-hover:opacity-100">
                <button className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => startEdit(banner)} type="button">
                  Edit
                </button>
                <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => remove(banner.id)} type="button">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
