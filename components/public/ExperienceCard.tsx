import Link from "next/link";
import type { Experience } from "@/lib/services/experiences";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? "text-amber-400" : "text-slate-300"}>★</span>
      ))}
    </span>
  );
}

const VISIT_LABELS: Record<string, string> = {
  purchase: "Bought a vehicle",
  service: "Service visit",
  test_ride: "Test ride",
  enquiry: "Showroom enquiry",
  first_ride: "First ride",
  long_ride: "Long ride",
  ownership: "Ownership review",
  other: "Experience",
};

export function ExperienceCard({ experience }: { experience: Experience }) {
  const date = new Date(experience.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/experiences/dealers/${experience.dealerSlug}`}
            className="block truncate font-black text-slate-950 transition hover:text-emerald-700"
          >
            {experience.dealerName}
          </Link>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500">{experience.dealerCity}</span>
            {experience.dealerBrand && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {experience.dealerBrand}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Stars value={experience.overallRating} />
          <div className="mt-0.5 text-xs text-slate-400">{date}</div>
        </div>
      </div>

      {experience.title && (
        <p className="mt-3 font-bold text-slate-800">&ldquo;{experience.title}&rdquo;</p>
      )}

      {(experience.visitType || experience.vehicleModel) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {experience.visitType && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {VISIT_LABELS[experience.visitType] ?? experience.visitType}
            </span>
          )}
          {experience.vehicleModel && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {experience.vehicleModel}
              {experience.vehicleVariant ? ` ${experience.vehicleVariant}` : ""}
            </span>
          )}
        </div>
      )}

      {experience.pros && (
        <div className="mt-3 flex gap-1.5">
          <span className="mt-0.5 shrink-0 text-xs text-emerald-500">✓</span>
          <p className="line-clamp-2 text-sm leading-5 text-slate-700">{experience.pros}</p>
        </div>
      )}
      {experience.cons && (
        <div className="mt-1 flex gap-1.5">
          <span className="mt-0.5 shrink-0 text-xs text-red-400">✗</span>
          <p className="line-clamp-2 text-sm leading-5 text-slate-700">{experience.cons}</p>
        </div>
      )}
      {experience.body && !experience.pros && !experience.cons && (
        <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-600">{experience.body}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
            {experience.reviewerName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-slate-600">{experience.reviewerName}</span>
          {experience.emailVerified && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
              ✓ Verified
            </span>
          )}
        </div>
        <Link
          href={`/experiences/dealers/${experience.dealerSlug}`}
          className="text-xs font-bold text-emerald-600 transition hover:text-emerald-800"
        >
          All reviews →
        </Link>
      </div>
    </div>
  );
}
