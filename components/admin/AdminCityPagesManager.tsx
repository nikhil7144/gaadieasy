"use client";

import { Edit3, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  adminFieldClass,
  deleteAdminJson,
  parseFaqLines,
  patchAdminJson,
  postAdminJson,
} from "@/components/admin/admin-form-utils";
import type { Brand, City, CityPage, VehicleCategory } from "@/types/automobile";

type CityPageForm = {
  cityId: string;
  slug: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  body: string;
  heroImageUrl: string;
  featuredCategoryId: string;
  featuredBrandIds: string[];
  faqText: string;
  showInFooter: boolean;
  displayOrder: number;
  active: boolean;
};

const emptyForm: CityPageForm = {
  cityId: "",
  slug: "",
  title: "",
  h1: "",
  metaTitle: "",
  metaDescription: "",
  intro: "",
  body: "",
  heroImageUrl: "",
  featuredCategoryId: "",
  featuredBrandIds: [],
  faqText: "",
  showInFooter: true,
  displayOrder: 0,
  active: true,
};

function formFromPage(page: CityPage): CityPageForm {
  return {
    cityId: page.cityId,
    slug: page.slug,
    title: page.title,
    h1: page.h1,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    intro: page.intro,
    body: page.body,
    heroImageUrl: page.heroImageUrl ?? "",
    featuredCategoryId: page.featuredCategoryId ?? "",
    featuredBrandIds: page.featuredBrandIds,
    faqText: page.faq.map((item) => `${item.question} | ${item.answer}`).join("\n"),
    showInFooter: page.showInFooter,
    displayOrder: page.displayOrder,
    active: page.active,
  };
}

function slugifyLocal(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminCityPagesManager({
  cityPages,
  cities,
  brands,
  categories,
}: {
  cityPages: CityPage[];
  cities: City[];
  brands: Brand[];
  categories: VehicleCategory[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<CityPageForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const cityById = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedPage = cityPages.find((page) => page.id === selectedId);
  const sortedPages = [...cityPages].sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));

  function updateField<Key extends keyof CityPageForm>(key: Key, value: CityPageForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setSelectedId("");
    setForm(emptyForm);
    setError("");
  }

  function editPage(page: CityPage) {
    setSelectedId(page.id);
    setForm(formFromPage(page));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCityChange(cityId: string) {
    const city = cityById.get(cityId);
    setForm((current) => ({
      ...current,
      cityId,
      slug: current.slug || (city ? slugifyLocal(city.slug || city.name) : ""),
      title: current.title || (city ? `Vehicle on-road prices in ${city.name}` : ""),
      h1: current.h1 || (city ? `On-road prices in ${city.name}` : ""),
      metaTitle: current.metaTitle || (city ? `Vehicle On-Road Prices in ${city.name} | Gaadieasy` : ""),
      metaDescription:
        current.metaDescription ||
        (city
          ? `Compare cars, bikes, scooters, EVs and commercial vehicle on-road prices in ${city.name} with RTO, insurance, dealer offers and brand-wise models.`
          : ""),
      intro:
        current.intro ||
        (city
          ? `Explore city-wise vehicle prices in ${city.name} with live model data, RTO context, dealer availability and transparent pricing sections.`
          : ""),
    }));
  }

  function toggleBrand(brandId: string) {
    setForm((current) => ({
      ...current,
      featuredBrandIds: current.featuredBrandIds.includes(brandId)
        ? current.featuredBrandIds.filter((id) => id !== brandId)
        : [...current.featuredBrandIds, brandId],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      cityId: form.cityId,
      slug: form.slug.trim(),
      title: form.title.trim(),
      h1: form.h1.trim(),
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      intro: form.intro.trim(),
      body: form.body.trim(),
      heroImageUrl: form.heroImageUrl.trim(),
      featuredCategoryId: form.featuredCategoryId,
      featuredBrandIds: form.featuredBrandIds,
      faq: parseFaqLines(form.faqText),
      showInFooter: form.showInFooter,
      displayOrder: Number(form.displayOrder),
      active: form.active,
    };

    try {
      if (selectedId) {
        await patchAdminJson("/api/admin/city-pages", { id: selectedId, ...payload });
      } else {
        await postAdminJson("/api/admin/city-pages", payload);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save city page");
    } finally {
      setSaving(false);
    }
  }

  async function togglePage(page: CityPage) {
    setBusyId(page.id);
    setError("");
    try {
      await patchAdminJson("/api/admin/city-pages", { id: page.id, active: !page.active });
      if (selectedId === page.id) updateField("active", !page.active);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update city page");
    } finally {
      setBusyId("");
    }
  }

  async function deletePage(page: CityPage) {
    if (!window.confirm(`Delete ${page.title}? This removes only the city page, not the city master.`)) return;
    setBusyId(page.id);
    setError("");
    try {
      await deleteAdminJson("/api/admin/city-pages", { id: page.id });
      if (selectedId === page.id) resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete city page");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(420px,520px)_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">City SEO</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              {selectedId ? "Edit city page" : "Create city page"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Control public city pages, footer visibility and the live model sections shown for each city.
            </p>
          </div>
          {selectedId ? (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              onClick={resetForm}
              type="button"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          ) : null}
        </div>

        {selectedPage ? (
          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-800">
            Editing: {selectedPage.title}
          </div>
        ) : null}

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
            City
            <select className={adminFieldClass} value={form.cityId} onChange={(event) => handleCityChange(event.target.value)} required>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option value={city.id} key={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>
          <input className={adminFieldClass} value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="Public slug, e.g. bangalore" required />
          <input className={adminFieldClass} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Page title" required />
          <input className={adminFieldClass} value={form.h1} onChange={(event) => updateField("h1", event.target.value)} placeholder="H1 heading" required />
          <input className={adminFieldClass} value={form.metaTitle} onChange={(event) => updateField("metaTitle", event.target.value)} placeholder="Meta title" required />
          <textarea className={`${adminFieldClass} min-h-20 py-3`} value={form.metaDescription} onChange={(event) => updateField("metaDescription", event.target.value)} placeholder="Meta description" required />
          <textarea className={`${adminFieldClass} min-h-24 py-3`} value={form.intro} onChange={(event) => updateField("intro", event.target.value)} placeholder="Intro copy" required />
          <textarea className={`${adminFieldClass} min-h-28 py-3`} value={form.body} onChange={(event) => updateField("body", event.target.value)} placeholder="Body copy" />
          <input className={adminFieldClass} value={form.heroImageUrl} onChange={(event) => updateField("heroImageUrl", event.target.value)} placeholder="Hero image URL optional" />

          <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
            Featured category
            <select className={adminFieldClass} value={form.featuredCategoryId} onChange={(event) => updateField("featuredCategoryId", event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-md border border-slate-200 p-3">
            <p className="text-xs font-black uppercase text-slate-500">Featured brands</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {brands.map((brand) => (
                <label className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700" key={brand.id}>
                  <input checked={form.featuredBrandIds.includes(brand.id)} onChange={() => toggleBrand(brand.id)} type="checkbox" />
                  {brand.name}
                </label>
              ))}
            </div>
          </div>

          <textarea className={`${adminFieldClass} min-h-24 py-3`} value={form.faqText} onChange={(event) => updateField("faqText", event.target.value)} placeholder="FAQs: Question | Answer, one per line" />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
              Display order
              <input className={adminFieldClass} value={form.displayOrder} onChange={(event) => updateField("displayOrder", Number(event.target.value))} type="number" />
            </label>
            <div className="grid gap-2 rounded-md border border-slate-200 p-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                <input checked={form.active} onChange={(event) => updateField("active", event.target.checked)} type="checkbox" />
                Active page
              </label>
              <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                <input checked={form.showInFooter} onChange={(event) => updateField("showInFooter", event.target.checked)} type="checkbox" />
                Show in footer
              </label>
            </div>
          </div>

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving" : selectedId ? "Update page" : "Save page"}
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50" onClick={resetForm} type="button">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">Saved city pages</p>
            <h2 className="text-xl font-black text-slate-950">Public city page list</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{cityPages.length} total</span>
        </div>
        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
          {sortedPages.map((page) => {
            const city = cityById.get(page.cityId);
            const category = page.featuredCategoryId ? categoryById.get(page.featuredCategoryId) : undefined;
            return (
              <div className="grid gap-3 bg-white p-4 lg:grid-cols-[1fr_auto]" key={page.id}>
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                    <span className={page.active ? "text-emerald-700" : "text-slate-400"}>{page.active ? "Active" : "Inactive"}</span>
                    <span className="text-slate-400">Order {page.displayOrder}</span>
                    {city ? <span className="text-slate-400">{city.name}</span> : null}
                    {category ? <span className="text-slate-400">{category.name}</span> : null}
                  </div>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{page.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{page.intro}</p>
                  <div className="mt-2 text-xs font-bold text-slate-500">/city/{page.slug}</div>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <a className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" href={`/city/${page.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    View
                  </a>
                  <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700" onClick={() => editPage(page)} type="button">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" disabled={busyId === page.id} onClick={() => togglePage(page)} type="button">
                    {page.active ? "Deactivate" : "Activate"}
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border border-red-100 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50" disabled={busyId === page.id} onClick={() => deletePage(page)} type="button">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!sortedPages.length ? (
            <div className="p-6 text-sm font-bold text-slate-500">No city pages yet. Create one from the form.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
