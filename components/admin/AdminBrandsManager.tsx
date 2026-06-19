"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import { slugify } from "@/lib/utils/format";
import type { Brand, VehicleCategory, VehicleModel, VehicleStory, VehicleStoryUpdate, VehicleStoryMedia } from "@/types/automobile";

type Tab = "brands" | "updates";

type StoryWithDetails = VehicleStory & {
  updates: VehicleStoryUpdate[];
  media: VehicleStoryMedia[];
};

export function AdminBrandsManager({
  brands,
  categories,
  brandStories = [],
  models = [],
}: {
  brands: Brand[];
  categories: VehicleCategory[];
  brandStories?: StoryWithDetails[];
  models?: VehicleModel[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("brands");

  // ── Brand form state ───────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [overview, setOverview] = useState("");
  const [tagline, setTagline] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [editingBrandId, setEditingBrandId] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function resetForm() {
    setName(""); setSlug(""); setLogoUrl(""); setCategoryIds([]);
    setFeatured(false); setActive(true); setOverview(""); setTagline("");
    setSeoTitle(""); setSeoDescription(""); setEditingBrandId(""); setLogoFile(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const firstCategorySlug = categories.find((c) => c.id === categoryIds[0])?.slug;
      const payload = {
        name,
        slug: slug || slugify(firstCategorySlug ? `${name} ${firstCategorySlug}` : name),
        logoUrl, categoryIds, active, featured, overview, tagline, seoTitle, seoDescription,
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
    setCategoryIds((cur) =>
      cur.includes(categoryId) ? cur.filter((id) => id !== categoryId) : [...cur, categoryId],
    );
  }

  function beginEdit(brand: Brand) {
    setEditingBrandId(brand.id); setName(brand.name); setSlug(brand.slug);
    setLogoUrl(brand.logoUrl ?? ""); setCategoryIds(brand.categoryIds ?? []);
    setFeatured(brand.featured); setActive(brand.active);
    setOverview(brand.overview ?? ""); setTagline(brand.tagline ?? "");
    setSeoTitle(brand.seoTitle ?? ""); setSeoDescription(brand.seoDescription ?? "");
    setLogoFile(null); setMessage(""); setError("");
  }

  async function handleLogoUpload() {
    if (!logoFile) return;
    setUploadingLogo(true); setMessage(""); setError("");
    try {
      const formData = new FormData();
      formData.set("file", logoFile);
      formData.set("brandSlug", slug || slugify(name || "brand"));
      const response = await fetch("/api/admin/brand-logo", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to upload brand logo");
      setLogoUrl(payload.url); setLogoFile(null);
      setMessage("Logo uploaded. Save the brand to keep it.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload brand logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleDeleteBrand(brand: Brand) {
    if (!window.confirm(`Delete ${brand.name}? This only works when the brand has no linked models or leads.`)) return;
    setSaving(true); setMessage(""); setError("");
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
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {(["brands", "updates"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-5 py-2 text-sm font-black transition-colors ${
              tab === t ? "bg-emerald-500 text-slate-950" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t === "brands" ? "Brands" : "Brand Updates"}
          </button>
        ))}
      </div>

      {tab === "brands" && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          {/* ── Form panel ── */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-emerald-700">Brand master</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{editingBrandId ? "Edit brand" : "Create brand"}</h1>
            <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
              <input className={adminFieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name" required />

              <div>
                <div className="mb-2 text-xs font-black uppercase text-slate-500">Brand category</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className={`rounded-md border px-3 py-2 text-sm font-bold ${
                        categoryIds.includes(c.id) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <input className="mr-2" type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <input className={adminFieldClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug auto-generates with category if blank" />

              {/* Logo */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 text-xs font-black uppercase text-slate-500">Brand logo</div>
                {logoUrl ? (
                  <div className="mb-3 flex items-center gap-3 rounded-md bg-slate-50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="h-10 w-16 rounded object-contain" src={logoUrl} alt={`${name || "Brand"} logo`} />
                    <div className="min-w-0 flex-1 truncate text-xs font-bold text-slate-500">{logoUrl}</div>
                  </div>
                ) : null}
                <input className={adminFieldClass} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL, or upload below" />
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className={adminFieldClass}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
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

              {/* Overview & SEO */}
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 text-xs font-black uppercase text-slate-500">Overview &amp; SEO</div>
                <div className="grid gap-3">
                  <input className={adminFieldClass} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short tagline (e.g. Pure driving pleasure)" />
                  <textarea
                    className={`${adminFieldClass} min-h-[100px] resize-y`}
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    placeholder="Brand overview (shown on the brand overview page)"
                  />
                  <input className={adminFieldClass} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO title (overrides auto-generated)" />
                  <textarea
                    className={`${adminFieldClass} min-h-[72px] resize-y`}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="SEO meta description"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured on homepage
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Active brand
              </label>

              {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400"
                  disabled={saving}
                >
                  {editingBrandId ? <Save size={16} /> : <Plus size={16} />}{" "}
                  {saving ? "Saving" : editingBrandId ? "Update brand" : "Save brand"}
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

          {/* ── Existing brands list ── */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Existing brands</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {brands.map((brand) => (
                <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]" key={brand.id}>
                  <div>
                    <div className="font-black text-slate-950">{brand.name}</div>
                    <div className="text-xs font-bold text-slate-500">/{brand.slug}</div>
                    {brand.tagline ? <div className="mt-1 text-xs italic text-slate-500">{brand.tagline}</div> : null}
                    {brand.logoUrl ? (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="h-8 w-16 rounded bg-slate-50 object-contain" src={brand.logoUrl} alt={`${brand.name} logo`} />
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(brand.categoryIds ?? []).map((cid) => {
                        const cat = categories.find((c) => c.id === cid);
                        return cat ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800" key={cid}>
                            {cat.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 text-xs font-black">
                    {brand.featured ? <span className="rounded-full bg-lime-100 px-2 py-1 text-emerald-800">Featured</span> : null}
                    {brand.overview ? <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Has overview</span> : null}
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
      )}

      {tab === "updates" && (
        <BrandUpdatesSection stories={brandStories} brands={brands} />
      )}
    </div>
  );
}

// ── Brand Updates Section ──────────────────────────────────────────────────

function BrandUpdatesSection({
  stories,
  brands,
}: {
  stories: StoryWithDetails[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const filteredStories = stories.filter((s) => s.brandSlug === selectedBrand?.slug && !s.modelId);

  // Story form
  const [editingId, setEditingId] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyTagline, setStoryTagline] = useState("");
  const [storyIntro, setStoryIntro] = useState("");
  const [storyBody, setStoryBody] = useState("");
  const [storyActive, setStoryActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Sub-update form
  const [expandedStoryId, setExpandedStoryId] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  function resetStoryForm() {
    setEditingId(""); setStoryTitle(""); setStoryTagline("");
    setStoryIntro(""); setStoryBody(""); setStoryActive(true);
    setMsg(""); setErr("");
  }

  function beginEditStory(story: VehicleStory) {
    setEditingId(story.id); setStoryTitle(story.title);
    setStoryTagline(story.tagline ?? ""); setStoryIntro(story.intro);
    setStoryBody(story.body); setStoryActive(story.active);
    setMsg(""); setErr("");
  }

  async function handleSaveStory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBrand) return;
    setSaving(true); setMsg(""); setErr("");
    try {
      const introText = storyIntro.trim() || storyBody.trim().slice(0, 160) || storyTitle;
      const payload = {
        brandSlug: selectedBrand.slug,
        brandName: selectedBrand.name,
        storyType: "brand_update",
        title: storyTitle,
        tagline: storyTagline,
        intro: introText.length < 10 ? introText.padEnd(10, " ") : introText,
        body: storyBody,
        launchStatus: "launched",
        active: storyActive,
        featured: false,
      };
      if (editingId) {
        await patchAdminJson("/api/admin/vehicle-stories", { id: editingId, ...payload });
      } else {
        await postAdminJson("/api/admin/vehicle-stories", payload);
      }
      resetStoryForm();
      setMsg(editingId ? "Update saved." : "Brand update posted.");
      router.refresh();
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStory(id: string) {
    if (!window.confirm("Delete this brand update?")) return;
    try {
      await deleteAdminJson("/api/admin/vehicle-stories", { id });
      router.refresh();
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "Unable to delete");
    }
  }

  async function handleAddUpdate(storyId: string) {
    if (!updateTitle.trim()) return;
    setSavingUpdate(true);
    try {
      await postAdminJson("/api/admin/vehicle-story-updates", { storyId, title: updateTitle, body: updateBody });
      setUpdateTitle(""); setUpdateBody("");
      router.refresh();
    } catch { /* ignore */ } finally {
      setSavingUpdate(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      {/* ── Form ── */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Brand news</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{editingId ? "Edit brand update" : "Post brand update"}</h2>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-bold text-slate-600">Brand</label>
          <select
            className={adminFieldClass}
            value={selectedBrandId}
            onChange={(e) => { setSelectedBrandId(e.target.value); resetStoryForm(); }}
          >
            {brands.filter((b) => b.active).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <form className="mt-3 grid gap-3" onSubmit={handleSaveStory}>
          <input className={adminFieldClass} value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="Update headline" required />
          <input className={adminFieldClass} value={storyTagline} onChange={(e) => setStoryTagline(e.target.value)} placeholder="Short tagline (optional)" />
          <textarea className={`${adminFieldClass} min-h-[72px] resize-y`} value={storyIntro} onChange={(e) => setStoryIntro(e.target.value)} placeholder="Brief intro / summary" />
          <textarea className={`${adminFieldClass} min-h-[100px] resize-y`} value={storyBody} onChange={(e) => setStoryBody(e.target.value)} placeholder="Full update body" />
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={storyActive} onChange={(e) => setStoryActive(e.target.checked)} />
            Published / active
          </label>
          {msg ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{msg}</p> : null}
          {err ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{err}</p> : null}
          <div className="flex gap-2">
            <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update" : "Post update"}
            </button>
            {editingId ? (
              <button className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700" onClick={resetStoryForm} type="button">
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {/* ── Existing stories ── */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          {selectedBrand?.name ?? "Brand"} updates{" "}
          <span className="text-sm font-semibold text-slate-500">({filteredStories.length})</span>
        </h2>
        <div className="mt-4 space-y-3">
          {filteredStories.length === 0 && (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No updates for this brand yet.</p>
          )}
          {filteredStories.map((story) => (
            <div key={story.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-slate-950">{story.title}</div>
                  {story.tagline ? <div className="text-xs italic text-slate-500">{story.tagline}</div> : null}
                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(story.createdAt).toLocaleDateString("en-IN")}
                    {story.active ? null : <span className="ml-2 text-amber-600">Draft</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 hover:border-emerald-300"
                    onClick={() => beginEditStory(story)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700"
                    onClick={() => handleDeleteStory(story.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Sub-updates */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <button
                  className="text-xs font-black text-emerald-700 hover:text-emerald-900"
                  type="button"
                  onClick={() => setExpandedStoryId(expandedStoryId === story.id ? "" : story.id)}
                >
                  {expandedStoryId === story.id ? "Hide" : `Updates (${story.updates.length})`}
                </button>
                {expandedStoryId === story.id && (
                  <div className="mt-2 space-y-2">
                    {story.updates.map((u) => (
                      <div key={u.id} className="rounded-md bg-slate-50 p-2 text-xs">
                        <div className="font-bold text-slate-800">{u.title}</div>
                        {u.body ? <div className="mt-0.5 text-slate-500">{u.body}</div> : null}
                      </div>
                    ))}
                    <div className="grid gap-2 pt-1">
                      <input
                        className={adminFieldClass}
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        placeholder="Sub-update title"
                      />
                      <textarea
                        className={`${adminFieldClass} min-h-[56px] resize-y`}
                        value={updateBody}
                        onChange={(e) => setUpdateBody(e.target.value)}
                        placeholder="Body (optional)"
                      />
                      <button
                        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:opacity-50"
                        disabled={savingUpdate || !updateTitle.trim()}
                        onClick={() => handleAddUpdate(story.id)}
                        type="button"
                      >
                        {savingUpdate ? "Posting…" : "Post sub-update"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
