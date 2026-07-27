"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, deleteAdminJson, parseOptionalJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { GearCollection, GearProduct } from "@/types/automobile";

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
  description: string;
  type: GearCollection["type"];
  bannerImage: string;
  icon: string;
  priority: number;
  isActive: boolean;
  maxProducts: number;
  conditionsText: string;
  startAt: string;
  endAt: string;
  productIds: string[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  type: "manual",
  bannerImage: "",
  icon: "",
  priority: 0,
  isActive: true,
  maxProducts: 12,
  conditionsText: "",
  startAt: "",
  endAt: "",
  productIds: [],
};

export function GearCollectionsList({ collections, products }: { collections: GearCollection[]; products: GearProduct[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function uploadBannerImage(file: File) {
    setUploadingBanner(true);
    setError("");
    try {
      const url = await uploadToStorage(file, "collections");
      setForm((prev) => (prev ? { ...prev, bannerImage: url } : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload image");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const rows = useMemo(() => {
    return collections
      .filter((c) => (search.trim() ? c.name.toLowerCase().includes(search.trim().toLowerCase()) : true))
      .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));
  }, [collections, search]);

  const productMatches = useMemo(() => {
    if (!productQuery.trim()) return [];
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 8);
  }, [productQuery, products]);

  function startAdd() {
    setError("");
    setForm({ ...emptyForm });
  }

  function startEdit(collection: GearCollection) {
    setError("");
    setForm({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description ?? "",
      type: collection.type,
      bannerImage: collection.bannerImage ?? "",
      icon: collection.icon ?? "",
      priority: collection.priority,
      isActive: collection.isActive,
      maxProducts: collection.maxProducts,
      conditionsText: Object.keys(collection.conditions).length ? JSON.stringify(collection.conditions, null, 2) : "",
      startAt: collection.startAt ? collection.startAt.slice(0, 16) : "",
      endAt: collection.endAt ? collection.endAt.slice(0, 16) : "",
      productIds: collection.productIds,
    });
  }

  function addProduct(id: string) {
    if (!form || form.productIds.includes(id)) return;
    setForm({ ...form, productIds: [...form.productIds, id] });
    setProductQuery("");
  }

  function removeProduct(id: string) {
    if (!form) return;
    setForm({ ...form, productIds: form.productIds.filter((p) => p !== id) });
  }

  function moveProduct(id: string, direction: -1 | 1) {
    if (!form) return;
    const index = form.productIds.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= form.productIds.length) return;
    const next = [...form.productIds];
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, productIds: next });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      let conditions: Record<string, unknown> = {};
      if (form.type === "dynamic" && form.conditionsText.trim()) {
        conditions = parseOptionalJson(form.conditionsText);
      }
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        type: form.type,
        bannerImage: form.bannerImage || undefined,
        icon: form.icon || undefined,
        priority: form.priority,
        isActive: form.isActive,
        maxProducts: form.maxProducts,
        conditions,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : "",
        endAt: form.endAt ? new Date(form.endAt).toISOString() : "",
        productIds: form.type === "dynamic" ? undefined : form.productIds,
      };
      if (form.id) {
        await patchAdminJson("/api/admin/gaadigear/collections", { id: form.id, ...payload });
      } else {
        await postAdminJson("/api/admin/gaadigear/collections", payload);
      }
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save collection. Check the Conditions JSON is valid.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this collection? Any homepage sections pointing at it will stop rendering.")) return;
    try {
      await deleteAdminJson("/api/admin/gaadigear/collections", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete collection");
    }
  }

  async function refresh(id: string) {
    setRefreshingId(id);
    try {
      await postAdminJson("/api/admin/gaadigear/collections/refresh", { id });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to refresh collection cache");
    } finally {
      setRefreshingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-black text-slate-950">Collections</h1>
        <button className="text-sm font-bold text-emerald-700 hover:underline" onClick={startAdd} type="button">
          + Add collection
        </button>
      </div>

      <input
        className={`${adminFieldClass} w-56`}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name"
        value={search}
      />

      {form && (
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <input className={adminFieldClass} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" value={form.name} />
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="slug (auto if blank)"
              value={form.slug}
            />
            <select
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, type: e.target.value as FormState["type"] })}
              value={form.type}
            >
              <option value="manual">Manual (hand-picked)</option>
              <option value="dynamic">Dynamic (rule-based)</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
              <option value="vehicle">Vehicle</option>
            </select>
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })}
              placeholder="Priority"
              type="number"
              value={form.priority}
            />
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) || 12 })}
              placeholder="Max products"
              type="number"
              value={form.maxProducts}
            />
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-500">Banner image (optional)</p>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-14 w-28 place-items-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={uploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                  type="button"
                >
                  {form.bannerImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Banner" className="h-full w-full object-cover" src={form.bannerImage} />
                  ) : (
                    <span className="m-auto text-[10px] font-bold text-slate-500">{uploadingBanner ? "…" : "+ Upload"}</span>
                  )}
                </button>
                {form.bannerImage && (
                  <button
                    className="text-xs font-bold text-red-600 hover:underline"
                    onClick={() => setForm({ ...form, bannerImage: "" })}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                accept="image/*"
                className="hidden"
                disabled={uploadingBanner}
                onChange={(e) => e.target.files?.[0] && uploadBannerImage(e.target.files[0])}
                ref={bannerInputRef}
                type="file"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} type="checkbox" />
              Active
            </label>
            <input
              className={adminFieldClass}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              type="datetime-local"
              value={form.startAt}
            />
            <input className={adminFieldClass} onChange={(e) => setForm({ ...form, endAt: e.target.value })} type="datetime-local" value={form.endAt} />
          </div>

          <textarea
            className={`${adminFieldClass} min-h-20 w-full py-2 font-mono text-xs`}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional, buyer-facing)"
            value={form.description}
          />

          {form.type === "dynamic" && (
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-500">
                Conditions JSON — e.g. {"{"}&ldquo;priceMax&rdquo;: 999{"}"} or {"{"}&ldquo;minDiscountPct&rdquo;: 20{"}"}
              </p>
              <textarea
                className={`${adminFieldClass} min-h-24 w-full py-2 font-mono text-xs`}
                onChange={(e) => setForm({ ...form, conditionsText: e.target.value })}
                placeholder='{"priceMax": 999, "sort": "newest"}'
                value={form.conditionsText}
              />
            </div>
          )}

          {form.type !== "dynamic" && (
            <div>
              <p className="mb-1 text-xs font-black uppercase text-slate-500">Products (ordered)</p>
              <input
                className={`${adminFieldClass} w-full`}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search product title to add…"
                value={productQuery}
              />
              {productMatches.length > 0 && (
                <div className="mt-1 rounded-md border border-slate-200 bg-white">
                  {productMatches.map((p) => (
                    <button
                      className="block w-full px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-emerald-50"
                      key={p.id}
                      onClick={() => addProduct(p.id)}
                      type="button"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 space-y-1">
                {form.productIds.length === 0 ? (
                  <p className="text-xs text-slate-400">No products added yet.</p>
                ) : (
                  form.productIds.map((id, index) => (
                    <div className="flex items-center gap-2 border-b border-slate-100 py-1.5 text-sm" key={id}>
                      <span className="flex-1 font-bold text-slate-800">{productById.get(id)?.title ?? id}</span>
                      <button
                        className="text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => moveProduct(id, -1)}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        disabled={index === form.productIds.length - 1}
                        onClick={() => moveProduct(id, 1)}
                        type="button"
                      >
                        ↓
                      </button>
                      <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => removeProduct(id)} type="button">
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {error && <p className="whitespace-pre-line text-sm font-bold text-red-600">{error}</p>}

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
          <p className="py-6 text-sm text-slate-500">No collections match this filter.</p>
        ) : (
          rows.map((c) => (
            <div className="group flex items-center gap-3 border-b border-slate-200 py-2 text-sm" key={c.id}>
              <div className="flex-1">
                <span className="font-bold text-slate-950">{c.name}</span>
                <span className="ml-2 text-xs text-slate-400">{c.slug}</span>
              </div>
              <div className="w-24 text-xs capitalize text-slate-500">{c.type}</div>
              <div className="w-28 text-xs text-slate-500">{c.type === "dynamic" ? "rule-based" : `${c.productIds.length} product${c.productIds.length === 1 ? "" : "s"}`}</div>
              <div className="flex w-20 items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-600">{c.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex w-40 shrink-0 justify-end gap-3 opacity-0 group-hover:opacity-100">
                <button
                  className="text-xs font-bold text-slate-500 hover:underline disabled:opacity-50"
                  disabled={refreshingId === c.id}
                  onClick={() => refresh(c.id)}
                  type="button"
                >
                  {refreshingId === c.id ? "Refreshing…" : "Refresh"}
                </button>
                <button className="text-xs font-bold text-emerald-700 hover:underline" onClick={() => startEdit(c)} type="button">
                  Edit
                </button>
                <button className="text-xs font-bold text-red-600 hover:underline" onClick={() => remove(c.id)} type="button">
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
