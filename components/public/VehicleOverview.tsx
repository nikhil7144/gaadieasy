"use client";

import { useState } from "react";
import { CircleCheck, CircleMinus } from "lucide-react";

type VehicleOverviewProps = {
  overview?: string;
  pros?: string[];
  cons?: string[];
};

export function VehicleOverview({ overview }: VehicleOverviewProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOverview = Boolean(overview);

  if (!hasOverview) {
    return null;
  }

  const shortOverview = overview && overview.length > 240 && !expanded ? `${overview.slice(0, 240)}...` : overview;

  return (
    <section id="overview" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Overview</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">About this vehicle</h2>
        </div>
        {overview && overview.length > 240 ? (
          <button className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800" onClick={() => setExpanded((value) => !value)} type="button">
            {expanded ? "See less" : "See more"}
          </button>
        ) : null}
      </div>
      {shortOverview ? <p className="mt-4 text-sm leading-7 text-slate-600">{shortOverview}</p> : null}
    </section>
  );
}

export function VehicleProsCons({ pros = [], cons = [] }: Pick<VehicleOverviewProps, "pros" | "cons">) {
  const hasPros = pros.length > 0;
  const hasCons = cons.length > 0;

  if (!hasPros && !hasCons) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Decision cues</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Pros and cons</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {hasPros ? (
          <div className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-4">
            <h3 className="font-black text-emerald-900">Pros</h3>
            <div className="mt-3 space-y-2">
              {pros.map((item) => (
                <div className="flex gap-2 text-sm font-medium leading-6 text-slate-700" key={item}>
                  <CircleCheck className="mt-1 shrink-0 text-emerald-700" size={16} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {hasCons ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <h3 className="font-black text-amber-900">Cons</h3>
            <div className="mt-3 space-y-2">
              {cons.map((item) => (
                <div className="flex gap-2 text-sm font-medium leading-6 text-slate-700" key={item}>
                  <CircleMinus className="mt-1 shrink-0 text-amber-700" size={16} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
