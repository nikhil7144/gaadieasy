"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { City, ComparisonPage, FaqItem, VehicleModel, VehicleVariant } from "@/types/automobile";

export function AdminComparisonsManager({
  comparisons,
  models,
  variants,
  cities,
}: {
  comparisons: ComparisonPage[];
  models: VehicleModel[];
  variants: VehicleVariant[];
  cities: City[];
}) {
  const router = useRouter();

  const [editingId, setEditingId] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [cityId, setCityId] = useState("");
  const [v1ModelId, setV1ModelId] = useState("");
  const [v1VariantId, setV1VariantId] = useState("");
  const [v2ModelId, setV2ModelId] = useState("");
  const [v2VariantId, setV2VariantId] = useState("");
  const [v3ModelId, setV3ModelId] = useState("");
  const [v3VariantId, setV3VariantId] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [intro, setIntro] = useState("");
  const [verdict, setVerdict] = useState("");
  const [faqText, setFaqText] = useState("");
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [showInFooter, setShowInFooter] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeModels = models.filter((m) => m.active);

  function variantsForModel(modelId: string) {
    return variants.filter((v) => v.modelId === modelId && v.active);
  }

  function faqToText(faq: FaqItem[]) {
    return faq.map((f) => `${f.question}|${f.answer}`).join("\n");
  }

  function parseFaq(text: string): FaqItem[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf("|");
        if (idx === -1) return null;
        return { question: line.slice(0, idx).trim(), answer: line.slice(idx + 1).trim() };
      })
      .filter((f): f is FaqItem => Boolean(f?.question && f?.answer));
  }

  function resetForm() {
    setEditingId("");
    setSlug("");
    setTitle("");
    setCityId("");
    setV1ModelId("");
    setV1VariantId("");
    setV2ModelId("");
    setV2VariantId("");
    setV3ModelId("");
    setV3VariantId("");
    setMetaTitle("");
    setMetaDescription("");
    setIntro("");
    setVerdict("");
    setFaqText("");
    setShowOnHomepage(false);
    setShowInFooter(false);
    setDisplayOrder(0);
    setActive(true);
    setMessage("");
    setError("");
  }

  function beginEdit(page: ComparisonPage) {
    setEditingId(page.id);
    setSlug(page.slug);
    setTitle(page.title);
    setCityId(page.cityId);
    setV1ModelId(page.vehicle1ModelId);
    setV1VariantId(page.vehicle1VariantId);
    setV2ModelId(page.vehicle2ModelId);
    setV2VariantId(page.vehicle2VariantId);
    setV3ModelId(page.vehicle3ModelId ?? "");
    setV3VariantId(page.vehicle3VariantId ?? "");
    setMetaTitle(page.metaTitle);
    setMetaDescription(page.metaDescription);
    setIntro(page.intro);
    setVerdict(page.verdict);
    setFaqText(faqToText(page.faq));
    setShowOnHomepage(page.showOnHomepage);
    setShowInFooter(page.showInFooter);
    setDisplayOrder(page.displayOrder);
    setActive(page.active);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        slug: slug.trim() || undefined,
        title,
        cityId,
        vehicle1ModelId: v1ModelId,
        vehicle1VariantId: v1VariantId,
        vehicle2ModelId: v2ModelId,
        vehicle2VariantId: v2VariantId,
        vehicle3ModelId: v3ModelId || undefined,
        vehicle3VariantId: v3VariantId || undefined,
        metaTitle,
        metaDescription,
        intro,
        verdict,
        faq: parseFaq(faqText),
        showOnHomepage,
        showInFooter,
        displayOrder,
        active,
      };
      if (editingId) {
        await patchAdminJson("/api/admin/comparison-pages", { id: editingId, ...payload });
        setMessage("Comparison page updated.");
      } else {
        await postAdminJson("/api/admin/comparison-pages", payload);
        resetForm();
        setMessage("Comparison page created.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(page: ComparisonPage) {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    try {
      await deleteAdminJson("/api/admin/comparison-pages", { id: page.id });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete");
    }
  }

  async function toggleActive(page: ComparisonPage) {
    try {
      await patchAdminJson("/api/admin/comparison-pages", { id: page.id, active: !page.active });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update");
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Comparisons</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">
          {editingId ? "Edit comparison" : "New comparison page"}
        </h1>

        <form className="mt-5 grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
          {/* Left column */}
          <div className="grid gap-3 content-start">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-black uppercase text-slate-500">Title *</div>
                <input
                  className={adminFieldClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Hyundai Creta vs Tata Nexon"
                  required
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-black uppercase text-slate-500">Slug (auto if blank)</div>
                <input
                  className={adminFieldClass}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="hyundai-creta-vs-tata-nexon"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">City *</div>
              <select className={adminFieldClass} value={cityId} onChange={(e) => setCityId(e.target.value)} required>
                <option value="">— Select city —</option>
                {cities.map((c) => (
                  <option value={c.id} key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Vehicle 1 */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 text-xs font-black uppercase text-emerald-700">Vehicle 1 *</div>
              <div className="grid gap-2">
                <select className={adminFieldClass} value={v1ModelId} onChange={(e) => { setV1ModelId(e.target.value); setV1VariantId(""); }} required>
                  <option value="">— Select model —</option>
                  {activeModels.map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}
                </select>
                <select className={adminFieldClass} value={v1VariantId} onChange={(e) => setV1VariantId(e.target.value)} required disabled={!v1ModelId}>
                  <option value="">— Select variant —</option>
                  {variantsForModel(v1ModelId).map((v) => <option value={v.id} key={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Vehicle 2 */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 text-xs font-black uppercase text-emerald-700">Vehicle 2 *</div>
              <div className="grid gap-2">
                <select className={adminFieldClass} value={v2ModelId} onChange={(e) => { setV2ModelId(e.target.value); setV2VariantId(""); }} required>
                  <option value="">— Select model —</option>
                  {activeModels.map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}
                </select>
                <select className={adminFieldClass} value={v2VariantId} onChange={(e) => setV2VariantId(e.target.value)} required disabled={!v2ModelId}>
                  <option value="">— Select variant —</option>
                  {variantsForModel(v2ModelId).map((v) => <option value={v.id} key={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Vehicle 3 (optional) */}
            <div className="rounded-lg border border-dashed border-slate-300 p-3">
              <div className="mb-2 text-xs font-black uppercase text-slate-400">Vehicle 3 (optional)</div>
              <div className="grid gap-2">
                <select className={adminFieldClass} value={v3ModelId} onChange={(e) => { setV3ModelId(e.target.value); setV3VariantId(""); }}>
                  <option value="">— None —</option>
                  {activeModels.map((m) => <option value={m.id} key={m.id}>{m.name}</option>)}
                </select>
                <select className={adminFieldClass} value={v3VariantId} onChange={(e) => setV3VariantId(e.target.value)} disabled={!v3ModelId}>
                  <option value="">— Select variant —</option>
                  {variantsForModel(v3ModelId).map((v) => <option value={v.id} key={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="grid gap-3 content-start">
            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">Intro * (shown on compare page)</div>
              <textarea
                className={`${adminFieldClass} min-h-20 py-3`}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Briefly describe what this comparison covers and who it helps."
                required
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">Verdict * (recommendation at bottom)</div>
              <textarea
                className={`${adminFieldClass} min-h-20 py-3`}
                value={verdict}
                onChange={(e) => setVerdict(e.target.value)}
                placeholder="Choose X if… Choose Y if…"
                required
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">SEO title *</div>
              <input className={adminFieldClass} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Hyundai Creta vs Tata Nexon — On-Road Price Comparison" required />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">SEO description *</div>
              <textarea className={`${adminFieldClass} min-h-16 py-3`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Compare Hyundai Creta and Tata Nexon by on-road price, specs and features." required />
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">FAQ — one per line: Question|Answer</div>
              <textarea
                className={`${adminFieldClass} min-h-24 py-3 font-mono text-xs`}
                value={faqText}
                onChange={(e) => setFaqText(e.target.value)}
                placeholder={"Which is cheaper on-road?|Nexon is generally cheaper in this segment.\nWhich is better for families?|Creta has more cabin space."}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <div className="mb-1 text-xs font-black uppercase text-slate-500">Display order</div>
                <input className={adminFieldClass} type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} />
                  Show on homepage
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={showInFooter} onChange={(e) => setShowInFooter(e.target.checked)} />
                  Show in footer
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  Active / published
                </label>
              </div>
            </div>

            {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</p> : null}
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-200"
                disabled={saving}
              >
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {saving ? "Saving…" : editingId ? "Update comparison" : "Create comparison"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-emerald-300"
                  onClick={resetForm}
                >
                  <X size={16} /> Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          All comparisons <span className="ml-2 text-sm font-bold text-slate-500">{comparisons.length} total</span>
        </h2>

        {comparisons.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No comparison pages yet. Create one above.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {comparisons.map((page) => {
              const m1 = models.find((m) => m.id === page.vehicle1ModelId);
              const m2 = models.find((m) => m.id === page.vehicle2ModelId);
              const m3 = page.vehicle3ModelId ? models.find((m) => m.id === page.vehicle3ModelId) : null;
              const city = cities.find((c) => c.id === page.cityId);
              return (
                <div key={page.id} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-950">{page.title}</span>
                      {!page.active ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">Inactive</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">Active</span>
                      )}
                      {page.showOnHomepage ? <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-black text-lime-800">Homepage</span> : null}
                      {page.showInFooter ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700">Footer</span> : null}
                    </div>
                    <div className="mt-0.5 text-xs font-bold text-slate-500">
                      /compare/{page.slug} · {city?.name ?? page.cityId} · Order: {page.displayOrder}
                    </div>
                    <div className="mt-1 text-xs font-bold text-emerald-700">
                      {[m1?.name, m2?.name, m3?.name].filter(Boolean).join(" vs ")}
                    </div>
                    <div className="mt-1 text-xs text-slate-400 line-clamp-1">{page.intro}</div>
                  </div>
                  <div className="flex flex-wrap items-start justify-end gap-2 text-xs font-black">
                    <a
                      href={`/compare/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                    >
                      <Eye size={12} /> View
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                      onClick={() => beginEdit(page)}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                        page.active
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                      }`}
                      onClick={() => toggleActive(page)}
                    >
                      {page.active ? <EyeOff size={12} /> : <Eye size={12} />}
                      {page.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 hover:border-red-300"
                      onClick={() => handleDelete(page)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
