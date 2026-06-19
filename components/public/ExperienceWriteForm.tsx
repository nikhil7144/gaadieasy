"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ModelOption = { id: string; name: string };

type Props = {
  defaultDealer?: string;
  defaultCity?: string;
  defaultBrand?: string;
  defaultVehicleModel?: string;
  brands?: string[];
  brandModels?: Record<string, ModelOption[]>;
};

function StarPicker({
  label,
  value,
  onChange,
  large = false,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  large?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = large ? "text-3xl" : "text-xl";

  const stars = (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${sz} leading-none transition-transform cursor-pointer hover:scale-110 ${active >= star ? "text-amber-400" : "text-slate-300"}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </span>
  );

  if (!label) return stars;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      {stars}
    </div>
  );
}


const VISIT_TYPES = [
  { value: "purchase", label: "Bought a vehicle", group: "buying" },
  { value: "test_ride", label: "Test ride / drive", group: "buying" },
  { value: "enquiry", label: "Showroom enquiry", group: "buying" },
  { value: "first_ride", label: "First ride impression", group: "riding" },
  { value: "long_ride", label: "Long ride / road trip", group: "riding" },
  { value: "ownership", label: "Long-term ownership", group: "riding" },
  { value: "service", label: "Service / workshop", group: "ownership" },
  { value: "other", label: "Other", group: "other" },
];

const RIDING_TYPES = new Set(["first_ride", "long_ride", "ownership"]);
const DEALER_TYPES = new Set(["purchase", "test_ride", "enquiry", "service"]);

const OVERALL_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

export function ExperienceWriteForm({ defaultDealer = "", defaultCity = "", defaultBrand = "", defaultVehicleModel = "", brands = [], brandModels = {} }: Props) {
  const router = useRouter();

  const [dealerName, setDealerName] = useState(defaultDealer);
  const [dealerCity, setDealerCity] = useState(defaultCity);
  const [dealerBrand, setDealerBrand] = useState(defaultBrand);

  const [modelId, setModelId] = useState("");
  const [vehicleModel, setVehicleModel] = useState(defaultVehicleModel);
  const [useCustomModel, setUseCustomModel] = useState(!!defaultVehicleModel);
  const [vehicleVariant, setVehicleVariant] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [visitType, setVisitType] = useState("");

  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");

  const [overallRating, setOverallRating] = useState(0);
  const [salesRating, setSalesRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [waitTimeRating, setWaitTimeRating] = useState(0);
  const [priceTransparencyRating, setPriceTransparencyRating] = useState(0);

  const [title, setTitle] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [body, setBody] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const isDealerExperience = !visitType || DEALER_TYPES.has(visitType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDealerExperience && !dealerName.trim()) { setError("Dealer / showroom name is required for this experience type."); return; }
    if (!dealerCity.trim()) { setError("City is required."); return; }
    if (!reviewerName.trim()) { setError("Your name is required."); return; }
    if (!overallRating) { setError("Please give an overall rating."); return; }

    setSubmitting(true);
    setError("");

    const effectiveDealerName = dealerName.trim() || (vehicleModel.trim() ? `${vehicleModel.trim()} — owner experience` : "Owner experience");

    try {
      const res = await fetch("/api/public/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerName: effectiveDealerName,
          dealerCity: dealerCity.trim(),
          dealerBrand: dealerBrand || undefined,
          modelId: modelId || undefined,
          vehicleModel: vehicleModel || undefined,
          vehicleVariant: vehicleVariant || undefined,
          purchaseYear: purchaseYear ? Number(purchaseYear) : undefined,
          visitType: visitType || undefined,
          reviewerName: reviewerName.trim(),
          reviewerEmail: reviewerEmail || undefined,
          overallRating,
          salesRating: salesRating || undefined,
          serviceRating: serviceRating || undefined,
          waitTimeRating: waitTimeRating || undefined,
          priceTransparencyRating: priceTransparencyRating || undefined,
          title: title || undefined,
          pros: pros || undefined,
          cons: cons || undefined,
          body: body || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Submission failed");

      router.push(`/experiences/dealers/${payload.dealerSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const lbl = "block text-xs font-black uppercase tracking-wide text-slate-600";
  const card = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section 1: Context */}
      <div className={card}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">1</span>
          <h2 className="text-base font-black text-slate-950">
            {isDealerExperience ? "Dealer / showroom" : "Your location & brand"}
          </h2>
        </div>
        <div className="space-y-4">
          {isDealerExperience && (
            <div>
              <label className={lbl}>Dealer / showroom name *</label>
              <input
                className={`mt-1.5 ${inp}`}
                placeholder="e.g. Hero MotoCorp – Koramangala"
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                maxLength={100}
              />
              <p className="mt-1 text-xs text-slate-400">Use the exact name as on the showroom board</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>City *</label>
              <input
                className={`mt-1.5 ${inp}`}
                placeholder="e.g. Bangalore"
                value={dealerCity}
                onChange={(e) => setDealerCity(e.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className={lbl}>Brand</label>
              <select className={`mt-1.5 ${inp}`} value={dealerBrand} onChange={(e) => { setDealerBrand(e.target.value); setModelId(""); setVehicleModel(""); setUseCustomModel(false); }}>
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Experience type + vehicle */}
      <div className={card}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">2</span>
          <h2 className="text-base font-black text-slate-950">Your experience</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={lbl}>What kind of experience?</label>
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Buying journey</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VISIT_TYPES.filter((vt) => vt.group === "buying").map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setVisitType(visitType === vt.value ? "" : vt.value)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition text-left ${
                      visitType === vt.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
              <p className="pt-1 text-[11px] font-black uppercase tracking-wide text-slate-400">Riding & ownership</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VISIT_TYPES.filter((vt) => vt.group === "riding" || vt.group === "ownership" || vt.group === "other").map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setVisitType(visitType === vt.value ? "" : vt.value)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition text-left ${
                      visitType === vt.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={lbl}>Vehicle model</label>
              {(() => {
                const catalogModels = brandModels[dealerBrand] ?? [];
                if (catalogModels.length > 0 && !useCustomModel) {
                  return (
                    <div className="mt-1.5 space-y-1.5">
                      <select
                        className={inp}
                        value={modelId}
                        onChange={(e) => {
                          const chosen = catalogModels.find((m) => m.id === e.target.value);
                          setModelId(e.target.value);
                          setVehicleModel(chosen?.name ?? "");
                        }}
                      >
                        <option value="">Select model</option>
                        {catalogModels.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="text-xs text-slate-400 underline-offset-1 hover:text-slate-600 hover:underline"
                        onClick={() => { setModelId(""); setVehicleModel(""); setUseCustomModel(true); }}
                      >
                        Not listed? Type manually
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="mt-1.5 space-y-1.5">
                    <input
                      className={inp}
                      placeholder="e.g. Splendor Plus"
                      value={vehicleModel}
                      onChange={(e) => { setVehicleModel(e.target.value); setModelId(""); }}
                      maxLength={100}
                    />
                    {catalogModels.length > 0 && useCustomModel && (
                      <button
                        type="button"
                        className="text-xs text-slate-400 underline-offset-1 hover:text-slate-600 hover:underline"
                        onClick={() => { setVehicleModel(""); setModelId(""); setUseCustomModel(false); }}
                      >
                        Pick from list
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label className={lbl}>Variant</label>
              <input
                className={`mt-1.5 ${inp}`}
                placeholder="e.g. Drum IBS"
                value={vehicleVariant}
                onChange={(e) => setVehicleVariant(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className={lbl}>Year</label>
              <select className={`mt-1.5 ${inp}`} value={purchaseYear} onChange={(e) => setPurchaseYear(e.target.value)}>
                <option value="">Select year</option>
                {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: About you */}
      <div className={card}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">3</span>
          <h2 className="text-base font-black text-slate-950">About you</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={lbl}>Your name *</label>
            <input
              className={`mt-1.5 ${inp}`}
              placeholder="e.g. Priya K."
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              maxLength={60}
            />
          </div>
          <div>
            <label className={lbl}>Email address</label>
            <input
              type="email"
              className={`mt-1.5 ${inp}`}
              placeholder="you@example.com"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              maxLength={120}
            />
            <p className="mt-1 text-xs text-slate-400">
              🔒 Never published. Email verification will be required in a future update to mark your experience as verified.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Ratings */}
      <div className={card}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">4</span>
          <h2 className="text-base font-black text-slate-950">Rate your experience</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Overall experience *</label>
            <div className="mt-2 flex items-center gap-3">
              <StarPicker value={overallRating} onChange={setOverallRating} large />
              {overallRating > 0 && (
                <span className="text-sm font-bold text-slate-600">{OVERALL_LABELS[overallRating]}</span>
              )}
            </div>
          </div>
          <div>
            <label className={`${lbl} mb-2`}>Specific aspects <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <div className="grid gap-2 sm:grid-cols-2">
              {RIDING_TYPES.has(visitType) ? (
                <>
                  <StarPicker label="Real-world performance" value={salesRating} onChange={setSalesRating} />
                  <StarPicker label="Comfort & ergonomics" value={serviceRating} onChange={setServiceRating} />
                  <StarPicker label="Fuel / range efficiency" value={waitTimeRating} onChange={setWaitTimeRating} />
                  <StarPicker label="Value for money" value={priceTransparencyRating} onChange={setPriceTransparencyRating} />
                </>
              ) : (
                <>
                  <StarPicker label="Sales team & transparency" value={salesRating} onChange={setSalesRating} />
                  <StarPicker label="Service & after-sales" value={serviceRating} onChange={setServiceRating} />
                  <StarPicker label="Delivery wait time" value={waitTimeRating} onChange={setWaitTimeRating} />
                  <StarPicker label="Price transparency" value={priceTransparencyRating} onChange={setPriceTransparencyRating} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Experience */}
      <div className={card}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-slate-950">5</span>
          <h2 className="text-base font-black text-slate-950">Write your experience</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Experience headline</label>
            <input
              className={`mt-1.5 ${inp}`}
              placeholder="e.g. Great sales team but delivery was delayed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>What went well ✓</label>
              <textarea
                className={`mt-1.5 ${inp} resize-none`}
                rows={3}
                placeholder={RIDING_TYPES.has(visitType)
                  ? "Great highway performance, comfortable seat, excellent mileage..."
                  : "Staff behaviour, smooth process, quick delivery..."}
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div>
              <label className={lbl}>What could be better ✗</label>
              <textarea
                className={`mt-1.5 ${inp} resize-none`}
                rows={3}
                placeholder={RIDING_TYPES.has(visitType)
                  ? "Vibrations at high speed, heavy clutch, limited range in heat..."
                  : "Long waiting time, hidden charges, pushy upselling..."}
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>
          <div>
            <label className={lbl}>Full experience <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <textarea
              className={`mt-1.5 ${inp} resize-none`}
              rows={4}
              placeholder={RIDING_TYPES.has(visitType)
                ? "Describe your ride — routes covered, real-world range or mileage, how it handles in city and on highway, what surprised you..."
                : "Describe your complete experience — from first visit, test ride, negotiation, paperwork, delivery, to service support..."}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
            />
            <div className="mt-1 text-right text-xs text-slate-400">{body.length}/2000</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Publish experience"}
        </button>
        <p className="text-xs text-slate-500">
          By submitting you confirm this is your genuine experience. False reviews may be removed.
        </p>
      </div>
    </form>
  );
}
