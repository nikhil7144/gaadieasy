"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function AdminHomepageBannersManager({ banners }: { banners: HeroPromotion[] }) {
  const router = useRouter();
  const [placement, setPlacement] = useState<"homepage_hero" | "mini_home_banner">("mini_home_banner");
  const [categoryKey, setCategoryKey] = useState<HeroPromotion["categoryKey"]>("cars");
  const [eyebrow, setEyebrow] = useState("");
  const [headline, setHeadline] = useState("");
  const [supportingCopy, setSupportingCopy] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [stat1Label, setStat1Label] = useState("");
  const [stat1Value, setStat1Value] = useState("");
  const [stat2Label, setStat2Label] = useState("");
  const [stat2Value, setStat2Value] = useState("");
  const [stat3Label, setStat3Label] = useState("");
  const [stat3Value, setStat3Value] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await postAdminJson("/api/admin/homepage-banners", {
        placement,
        categoryKey,
        eyebrow,
        headline,
        supportingCopy,
        title,
        subtitle,
        ctaLabel,
        stat1Label,
        stat1Value,
        stat2Label,
        stat2Value,
        stat3Label,
        stat3Value,
        imageUrl,
        targetUrl,
        active: true,
      });
      setEyebrow("");
      setHeadline("");
      setSupportingCopy("");
      setTitle("");
      setSubtitle("");
      setCtaLabel("");
      setStat1Label("");
      setStat1Value("");
      setStat2Label("");
      setStat2Value("");
      setStat3Label("");
      setStat3Value("");
      setImageUrl("");
      setTargetUrl("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create banner");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBanner(banner: HeroPromotion) {
    setBusyId(banner.id);
    try {
      await patchAdminJson("/api/admin/homepage-banners", { id: banner.id, active: !banner.active });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update banner");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Homepage content</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Create banner</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use this for the main homepage hero and the mini-homepage banner card for each vehicle tab.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <select className={adminFieldClass} value={placement} onChange={(event) => setPlacement(event.target.value as "homepage_hero" | "mini_home_banner")}>
              <option value="mini_home_banner">Mini homepage banner</option>
              <option value="homepage_hero">Homepage hero</option>
            </select>
            <select className={adminFieldClass} value={categoryKey} onChange={(event) => setCategoryKey(event.target.value as HeroPromotion["categoryKey"])}>
              {categoryOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input className={adminFieldClass} value={eyebrow} onChange={(event) => setEyebrow(event.target.value)} placeholder="Eyebrow / label" />
            <input className={adminFieldClass} value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Homepage hero bold headline" />
            <textarea className={`${adminFieldClass} min-h-20 py-3`} value={supportingCopy} onChange={(event) => setSupportingCopy(event.target.value)} placeholder="Homepage hero supporting line" />
            <input className={adminFieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Banner title" required />
            <textarea className={`${adminFieldClass} min-h-24 py-3`} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Supporting copy" />
            <input className={adminFieldClass} value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} placeholder="CTA label, e.g. Explore now" />
            <div className="grid gap-3 md:grid-cols-2">
              <input className={adminFieldClass} value={stat1Label} onChange={(event) => setStat1Label(event.target.value)} placeholder="Stat 1 label, e.g. Price" />
              <input className={adminFieldClass} value={stat1Value} onChange={(event) => setStat1Value(event.target.value)} placeholder="Stat 1 value, e.g. INR 2.59 L" />
              <input className={adminFieldClass} value={stat2Label} onChange={(event) => setStat2Label(event.target.value)} placeholder="Stat 2 label, e.g. CC" />
              <input className={adminFieldClass} value={stat2Value} onChange={(event) => setStat2Value(event.target.value)} placeholder="Stat 2 value, e.g. 398 cc" />
              <input className={adminFieldClass} value={stat3Label} onChange={(event) => setStat3Label(event.target.value)} placeholder="Stat 3 label, e.g. Power" />
              <input className={adminFieldClass} value={stat3Value} onChange={(event) => setStat3Value(event.target.value)} placeholder="Stat 3 value, e.g. 40 PS" />
            </div>
            <input className={adminFieldClass} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Banner image URL" required />
            <input className={adminFieldClass} value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="Target URL, e.g. /on-road-price?brand=..." required />
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
              {saving ? "Saving" : "Save banner"}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Existing banners</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {banners.map((banner) => (
              <div className="overflow-hidden rounded-lg border border-slate-200" key={banner.id}>
                <div className="aspect-[16/9] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover" src={banner.imageUrl} alt={banner.title} />
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
                  {banner.subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{banner.subtitle}</p> : null}
                  {(banner.stat1Label || banner.stat2Label || banner.stat3Label) ? (
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
                  ) : null}
                  <div className="mt-3 text-xs font-bold text-slate-500">{banner.targetUrl}</div>
                  <button
                    className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
                    disabled={busyId === banner.id}
                    onClick={() => toggleBanner(banner)}
                    type="button"
                  >
                    {busyId === banner.id ? "Updating" : banner.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
