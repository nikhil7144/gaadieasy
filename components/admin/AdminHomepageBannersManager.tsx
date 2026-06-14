"use client";

import { Edit3, ImageIcon, Plus, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { HeroPromotion } from "@/types/automobile";

const categoryOptions: Array<{ value: HeroPromotion["categoryKey"]; label: string }> = [
  { value: "cars", label: "Cars" },
  { value: "bikes", label: "Bikes" },
  { value: "scooters", label: "Scooters" },
  { value: "ev", label: "EV Vehicles" },
  { value: "commercial", label: "Commercial" },
  { value: "ev-commercial", label: "EV Commercial" },
  { value: "passenger-ev", label: "Passenger EV" },
];

type BannerFormState = {
  placement: "homepage_hero" | "mini_home_banner";
  categoryKey: HeroPromotion["categoryKey"];
  eyebrow: string;
  headline: string;
  supportingCopy: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  imageUrl: string;
  targetUrl: string;
  active: boolean;
};

const emptyBannerForm: BannerFormState = {
  placement: "homepage_hero",
  categoryKey: "cars",
  eyebrow: "",
  headline: "",
  supportingCopy: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  stat1Label: "",
  stat1Value: "",
  stat2Label: "",
  stat2Value: "",
  stat3Label: "",
  stat3Value: "",
  imageUrl: "",
  targetUrl: "",
  active: true,
};

function formFromBanner(banner: HeroPromotion): BannerFormState {
  return {
    placement: banner.placement ?? "homepage_hero",
    categoryKey: banner.categoryKey,
    eyebrow: banner.eyebrow ?? "",
    headline: banner.headline ?? "",
    supportingCopy: banner.supportingCopy ?? "",
    title: banner.title ?? "",
    subtitle: banner.subtitle ?? "",
    ctaLabel: banner.ctaLabel ?? "",
    stat1Label: banner.stat1Label ?? "",
    stat1Value: banner.stat1Value ?? "",
    stat2Label: banner.stat2Label ?? "",
    stat2Value: banner.stat2Value ?? "",
    stat3Label: banner.stat3Label ?? "",
    stat3Value: banner.stat3Value ?? "",
    imageUrl: banner.imageUrl ?? "",
    targetUrl: banner.targetUrl ?? "",
    active: banner.active,
  };
}

function BannerImagePreview({ imageUrl, title }: { imageUrl?: string; title: string }) {
  if (!imageUrl?.trim()) {
    return (
      <div className="grid h-full w-full place-items-center bg-slate-100 text-center">
        <div className="px-4">
          <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-xs font-black uppercase text-slate-500">Image pending</p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className="h-full w-full object-cover" src={imageUrl} alt={title || "Homepage banner"} />;
}

export function AdminHomepageBannersManager({ banners }: { banners: HeroPromotion[] }) {
  const router = useRouter();
  const [selectedBannerId, setSelectedBannerId] = useState("");
  const [form, setForm] = useState<BannerFormState>(emptyBannerForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const selectedBanner = useMemo(
    () => banners.find((banner) => banner.id === selectedBannerId),
    [banners, selectedBannerId],
  );
  const isEditing = Boolean(selectedBannerId);

  function updateField<Key extends keyof BannerFormState>(key: Key, value: BannerFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setSelectedBannerId("");
    setForm(emptyBannerForm);
    setError("");
  }

  function editBanner(banner: HeroPromotion) {
    setSelectedBannerId(banner.id);
    setForm(formFromBanner(banner));
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      eyebrow: form.eyebrow.trim(),
      headline: form.headline.trim(),
      supportingCopy: form.supportingCopy.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      ctaLabel: form.ctaLabel.trim(),
      stat1Label: form.stat1Label.trim(),
      stat1Value: form.stat1Value.trim(),
      stat2Label: form.stat2Label.trim(),
      stat2Value: form.stat2Value.trim(),
      stat3Label: form.stat3Label.trim(),
      stat3Value: form.stat3Value.trim(),
      imageUrl: form.imageUrl.trim(),
      targetUrl: form.targetUrl.trim(),
    };

    try {
      if (isEditing) {
        await patchAdminJson("/api/admin/homepage-banners", { id: selectedBannerId, ...payload });
      } else {
        await postAdminJson("/api/admin/homepage-banners", payload);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save banner");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBanner(banner: HeroPromotion) {
    setBusyId(banner.id);
    setError("");
    try {
      await patchAdminJson("/api/admin/homepage-banners", { id: banner.id, active: !banner.active });
      if (selectedBannerId === banner.id) updateField("active", !banner.active);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update banner");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(420px,480px)_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Homepage content</p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">
                {isEditing ? "Edit banner" : "Create banner"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Main homepage hero and mini-homepage banner cards are controlled from here.
              </p>
            </div>
            {isEditing ? (
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

          {selectedBanner ? (
            <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase text-emerald-800">
              Editing: {selectedBanner.title}
            </div>
          ) : null}

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                Placement
                <select
                  className={adminFieldClass}
                  value={form.placement}
                  onChange={(event) => updateField("placement", event.target.value as BannerFormState["placement"])}
                >
                  <option value="homepage_hero">Homepage hero</option>
                  <option value="mini_home_banner">Mini homepage banner</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black uppercase text-slate-500">
                Vehicle section
                <select
                  className={adminFieldClass}
                  value={form.categoryKey}
                  onChange={(event) => updateField("categoryKey", event.target.value as HeroPromotion["categoryKey"])}
                >
                  {categoryOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <input className={adminFieldClass} value={form.eyebrow} onChange={(event) => updateField("eyebrow", event.target.value)} placeholder="Eyebrow / label" />
            <input className={adminFieldClass} value={form.headline} onChange={(event) => updateField("headline", event.target.value)} placeholder="Homepage hero bold headline" />
            <textarea className={`${adminFieldClass} min-h-20 py-3`} value={form.supportingCopy} onChange={(event) => updateField("supportingCopy", event.target.value)} placeholder="Homepage hero supporting line" />
            <input className={adminFieldClass} value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Banner card title" required />
            <textarea className={`${adminFieldClass} min-h-24 py-3`} value={form.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} placeholder="Banner card supporting copy" />
            <input className={adminFieldClass} value={form.ctaLabel} onChange={(event) => updateField("ctaLabel", event.target.value)} placeholder="CTA label, e.g. Explore now" />

            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-black uppercase text-slate-500">Stats below image</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input className={adminFieldClass} value={form.stat1Label} onChange={(event) => updateField("stat1Label", event.target.value)} placeholder="Stat 1 label, e.g. Price" />
                <input className={adminFieldClass} value={form.stat1Value} onChange={(event) => updateField("stat1Value", event.target.value)} placeholder="Stat 1 value, e.g. INR 2.59 L" />
                <input className={adminFieldClass} value={form.stat2Label} onChange={(event) => updateField("stat2Label", event.target.value)} placeholder="Stat 2 label, e.g. CC" />
                <input className={adminFieldClass} value={form.stat2Value} onChange={(event) => updateField("stat2Value", event.target.value)} placeholder="Stat 2 value, e.g. 398 cc" />
                <input className={adminFieldClass} value={form.stat3Label} onChange={(event) => updateField("stat3Label", event.target.value)} placeholder="Stat 3 label, e.g. Power" />
                <input className={adminFieldClass} value={form.stat3Value} onChange={(event) => updateField("stat3Value", event.target.value)} placeholder="Stat 3 value, e.g. 40 PS" />
              </div>
            </div>

            <input className={adminFieldClass} value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} placeholder="Banner image URL" required />
            <input className={adminFieldClass} value={form.targetUrl} onChange={(event) => updateField("targetUrl", event.target.value)} placeholder="Target URL, e.g. /on-road-price?brand=..." required />
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input checked={form.active} onChange={(event) => updateField("active", event.target.checked)} type="checkbox" />
              Active banner
            </label>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving" : isEditing ? "Update banner" : "Save banner"}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                onClick={resetForm}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Saved banners</p>
              <h2 className="text-xl font-black text-slate-950">Existing homepage banners</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {banners.length} total
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {banners.map((banner) => (
              <div
                className={`overflow-hidden rounded-lg border ${
                  selectedBannerId === banner.id ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"
                }`}
                key={banner.id}
              >
                <div className="aspect-[16/9] bg-slate-100">
                  <BannerImagePreview imageUrl={banner.imageUrl} title={banner.title} />
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{banner.placement ?? "homepage_hero"}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{banner.categoryKey}</span>
                    <span className={`rounded-full px-2 py-1 ${banner.active ? "bg-lime-100 text-lime-900" : "bg-slate-200 text-slate-700"}`}>
                      {banner.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {banner.eyebrow ? <div className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-700">{banner.eyebrow}</div> : null}
                  {banner.headline ? <div className="mt-1 text-sm font-bold text-slate-700">{banner.headline}</div> : null}
                  <div className="mt-1 text-lg font-black text-slate-950">{banner.title}</div>
                  {banner.subtitle ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{banner.subtitle}</p> : null}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      [banner.stat1Value, banner.stat1Label],
                      [banner.stat2Value, banner.stat2Label],
                      [banner.stat3Value, banner.stat3Label],
                    ].map(([value, label], index) => (
                      <div className="rounded-md bg-slate-50 p-2" key={`${banner.id}-stat-${index}`}>
                        <div className="text-sm font-black text-slate-950">{value || "-"}</div>
                        <div className="text-[11px] font-bold text-slate-500">{label || "-"}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 truncate text-xs font-bold text-slate-500">{banner.targetUrl}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                      onClick={() => editBanner(banner)}
                      type="button"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
                      disabled={busyId === banner.id}
                      onClick={() => toggleBanner(banner)}
                      type="button"
                    >
                      {busyId === banner.id ? "Updating" : banner.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
