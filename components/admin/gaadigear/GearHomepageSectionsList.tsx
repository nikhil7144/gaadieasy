"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { GearCollection, GearHomepageSection } from "@/types/automobile";

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  collectionId: string;
  displayStyle: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormState = { title: "", subtitle: "", collectionId: "", displayStyle: "carousel", sortOrder: 0, isActive: true };

export function GearHomepageSectionsList({ sections, collections }: { sections: GearHomepageSection[]; collections: GearCollection[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const collectionName = useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections]);
  const rows = useMemo(() => [...sections].sort((a, b) => a.sortOrder - b.sortOrder), [sections]);

  function startAdd() {
    setError("");
    setForm({ ...emptyForm, sortOrder: rows.length });
  }

  function startEdit(section: GearHomepageSection) {
    setError("");
    setForm({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle ?? "",
      collectionId: section.collectionId ?? "",
      displayStyle: section.displayStyle,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
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
        collectionId: form.collectionId || undefined,
        displayStyle: form.displayStyle,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.id) {
        await patchAdminJson("/api/admin/gaadigear/homepage-sections", { id: form.id, ...payload });
      } else {
        await postAdminJson("/api/admin/gaadigear/homepage-sections", payload);
      }
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save section");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this section from the homepage?")) return;
    try {
      await deleteAdminJson("/api/admin/gaadigear/homepage-sections", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete section");
    }
  }

  async function move(section: GearHomepageSection, direction: -1 | 1) {
    const index = rows.findIndex((r) => r.id === section.id);
    const target = rows[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        patchAdminJson("/api/admin/gaadigear/homepage-sections", { id: section.id, sortOrder: target.sortOrder }),
        patchAdminJson("/api/admin/gaadigear/homepage-sections", { id: target.id, sortOrder: section.sortOrder }),
      ]);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to reorder sections");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-black text-slate-950">Homepage sections</h1>
        <button className="text-sm font-bold text-emerald-700 hover:underline" onClick={startAdd} type="button">
          + Add section
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Ordered top-to-bottom on <code className="font-mono">/gaadigear</code>. Each section renders one collection.
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
            <select className={adminFieldClass} onChange={(e) => setForm({ ...form, collectionId: e.target.value })} value={form.collectionId}>
              <option value="">Select collection…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className={adminFieldClass} onChange={(e) => setForm({ ...form, displayStyle: e.target.value })} value={form.displayStyle}>
              <option value="carousel">Carousel</option>
              <option value="grid">Grid</option>
              <option value="banner">Banner</option>
              <option value="hero">Hero</option>
              <option value="featured">Featured</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} type="checkbox" />
              Active
            </label>
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
          <p className="py-6 text-sm text-slate-500">No homepage sections configured yet.</p>
        ) : (
          rows.map((s, index) => (
            <div className="group flex items-center gap-3 border-b border-slate-200 py-2 text-sm" key={s.id}>
              <div className="flex-1">
                <span className="font-bold text-slate-950">{s.title}</span>
                <span className="ml-2 text-xs text-slate-400">{s.collectionId ? collectionName.get(s.collectionId) ?? "—" : "no collection"}</span>
              </div>
              <div className="flex w-20 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-600">{s.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex w-44 shrink-0 justify-end gap-3">
                <button
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => move(s, -1)}
                  type="button"
                >
                  ↑
                </button>
                <button
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  disabled={index === rows.length - 1}
                  onClick={() => move(s, 1)}
                  type="button"
                >
                  ↓
                </button>
                <button className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => startEdit(s)} type="button">
                  Edit
                </button>
                <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => remove(s.id)} type="button">
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
