"use client";

import { useState } from "react";
import type { VehicleReview, ReviewSummary } from "@/lib/services/reviews";

type Props = {
  modelId: string;
  variantId: string;
  modelName: string;
  initialReviews: VehicleReview[];
  summary: ReviewSummary | null;
};

function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = size === "sm" ? "text-base" : "text-2xl";

  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${sz} leading-none transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} ${active >= star ? "text-amber-400" : "text-slate-300"}`}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs font-bold text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs font-black text-slate-700">{value > 0 ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: VehicleReview }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
              {review.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">{review.userName}</div>
              {(review.city || review.ownedFor) && (
                <div className="text-xs text-slate-500">
                  {[review.city, review.ownedFor ? `Owned for ${review.ownedFor}` : ""].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <StarRating value={review.overallRating} size="sm" />
          <div className="mt-0.5 text-xs text-slate-400">{date}</div>
        </div>
      </div>

      {(review.engineRating || review.dealerRating || review.comfortRating || review.valueRating) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.engineRating && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              Engine <span className="text-amber-500">{"★".repeat(review.engineRating)}</span>
            </span>
          )}
          {review.dealerRating && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              Dealer <span className="text-amber-500">{"★".repeat(review.dealerRating)}</span>
            </span>
          )}
          {review.comfortRating && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              Comfort <span className="text-amber-500">{"★".repeat(review.comfortRating)}</span>
            </span>
          )}
          {review.valueRating && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              Value <span className="text-amber-500">{"★".repeat(review.valueRating)}</span>
            </span>
          )}
        </div>
      )}

      {review.pros && (
        <div className="mt-3 flex gap-2">
          <span className="mt-0.5 shrink-0 text-sm text-emerald-500">✓</span>
          <p className="text-sm leading-6 text-slate-700">{review.pros}</p>
        </div>
      )}
      {review.cons && (
        <div className="mt-1 flex gap-2">
          <span className="mt-0.5 shrink-0 text-sm text-red-400">✗</span>
          <p className="text-sm leading-6 text-slate-700">{review.cons}</p>
        </div>
      )}
      {review.body && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{review.body}</p>
      )}
    </div>
  );
}

const OWNED_FOR_OPTIONS = [
  "Less than 3 months",
  "3–6 months",
  "6–12 months",
  "1–2 years",
  "More than 2 years",
  "Test ride only",
];

export function VehicleReviews({ modelId, variantId, modelName, initialReviews, summary: initialSummary }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [userName, setUserName] = useState("");
  const [city, setCity] = useState("");
  const [ownedFor, setOwnedFor] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [engineRating, setEngineRating] = useState(0);
  const [dealerRating, setDealerRating] = useState(0);
  const [comfortRating, setComfortRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!overallRating) { setError("Please select an overall rating."); return; }
    if (!userName.trim()) { setError("Please enter your name."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          variantId,
          userName,
          city: city || undefined,
          ownedFor: ownedFor || undefined,
          overallRating,
          engineRating: engineRating || undefined,
          dealerRating: dealerRating || undefined,
          comfortRating: comfortRating || undefined,
          valueRating: valueRating || undefined,
          pros: pros || undefined,
          cons: cons || undefined,
          body: body || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Submission failed");

      setReviews((prev) => [payload.review as VehicleReview, ...prev]);
      setSubmitted(true);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const labelClass = "block text-xs font-black uppercase tracking-wide text-slate-600";

  return (
    <section className="mx-auto max-w-4xl px-4 pb-12 sm:px-6" id="reviews">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Owner experiences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real feedback from {modelName} owners
          </p>
        </div>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-400"
          >
            + Write your experience
          </button>
        )}
        {submitted && (
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            ✓ Thanks for sharing your experience!
          </span>
        )}
      </div>

      {/* Summary */}
      {summary && summary.count > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-slate-950">{summary.averageOverall.toFixed(1)}</div>
              <StarRating value={Math.round(summary.averageOverall)} size="sm" />
              <div className="mt-1 text-xs text-slate-500">{summary.count} review{summary.count !== 1 ? "s" : ""}</div>
            </div>
            <div className="flex-1 space-y-2 min-w-[200px]">
              <RatingBar label="Engine" value={summary.averageEngine} />
              <RatingBar label="Dealership" value={summary.averageDealer} />
              <RatingBar label="Comfort & Ride" value={summary.averageComfort} />
              <RatingBar label="Value for Money" value={summary.averageValue} />
            </div>
          </div>
        </div>
      )}

      {/* Write experience form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Share your experience</h3>
          <p className="mt-1 text-xs text-slate-500">Your honest feedback helps other buyers make better decisions.</p>

          <div className="mt-5 grid gap-5">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Your name *</label>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="e.g. Rahul M."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="e.g. Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={60}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>How long have you owned / ridden it?</label>
              <select className={`mt-1.5 ${inputClass}`} value={ownedFor} onChange={(e) => setOwnedFor(e.target.value)}>
                <option value="">Select duration</option>
                {OWNED_FOR_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Overall rating */}
            <div>
              <label className={labelClass}>Overall rating *</label>
              <div className="mt-1.5">
                <StarRating value={overallRating} onChange={setOverallRating} />
                {overallRating > 0 && (
                  <span className="ml-2 text-xs font-bold text-slate-500">
                    {["", "Poor", "Below average", "Average", "Good", "Excellent"][overallRating]}
                  </span>
                )}
              </div>
            </div>

            {/* Category ratings */}
            <div>
              <label className={labelClass}>Rate specific aspects (optional)</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Engine performance", value: engineRating, set: setEngineRating },
                  { label: "Dealership experience", value: dealerRating, set: setDealerRating },
                  { label: "Comfort & ride quality", value: comfortRating, set: setComfortRating },
                  { label: "Value for money", value: valueRating, set: setValueRating },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-xs font-bold text-slate-600">{label}</span>
                    <StarRating value={value} onChange={set} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pros / Cons */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>What did you like? ✓</label>
                <textarea
                  className={`mt-1.5 ${inputClass} resize-none`}
                  rows={3}
                  placeholder="e.g. Smooth engine, great mileage, comfortable seat..."
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  maxLength={1000}
                />
              </div>
              <div>
                <label className={labelClass}>What could be better? ✗</label>
                <textarea
                  className={`mt-1.5 ${inputClass} resize-none`}
                  rows={3}
                  placeholder="e.g. Heavy in traffic, dealer took too long..."
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </div>

            {/* Detailed experience */}
            <div>
              <label className={labelClass}>Detailed experience (optional)</label>
              <textarea
                className={`mt-1.5 ${inputClass} resize-none`}
                rows={4}
                placeholder="Tell other buyers about your overall ownership experience, any issues you faced, long-distance trips, service experience..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-400 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit experience"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        !showForm && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-3xl">🏍️</div>
            <p className="mt-3 font-black text-slate-700">No experiences shared yet</p>
            <p className="mt-1 text-sm text-slate-500">Be the first to share your experience with the {modelName}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-400"
            >
              + Write your experience
            </button>
          </div>
        )
      )}
    </section>
  );
}
