"use client";

import { useState } from "react";
import Link from "next/link";
import { calcEmi } from "@/lib/utils/emi";

function inLakh(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function DarkSlider({
  label, value, min, max, step, badge, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; badge: string; onChange: (v: number) => void;
}) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400">{label}</span>
        <span className="text-xs font-black text-lime-300">{badge}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full cursor-pointer"
        style={{
          accentColor: "#bef264",
          background: `linear-gradient(to right, #bef264 ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
          borderRadius: "9999px",
          height: "5px",
          outline: "none",
          appearance: "auto",
        }}
      />
    </div>
  );
}

export function EmiPreview({
  onRoadPrice,
  brandSlug,
  modelSlug,
  variantSlug,
  citySlug,
  vehicleName,
}: {
  onRoadPrice: number;
  brandSlug: string;
  modelSlug: string;
  variantSlug: string;
  citySlug: string;
  vehicleName: string;
}) {
  const [downPct, setDownPct] = useState(20);
  const [roi, setRoi]         = useState(9.5);
  const [tenure, setTenure]   = useState(60);

  const downAmount   = Math.round((onRoadPrice * downPct) / 100);
  const loanAmount   = onRoadPrice - downAmount;
  const emi          = calcEmi(loanAmount, roi, tenure);
  const totalInterest = Math.max(0, emi * tenure - loanAmount);

  const href = `/emi-calculator?price=${onRoadPrice}&name=${encodeURIComponent(vehicleName)}&brand=${brandSlug}&model=${modelSlug}&variant=${variantSlug}&city=${citySlug}`;

  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-950 to-emerald-950 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-wide text-lime-300">Finance planning</p>
      <h2 className="mt-1 text-xl font-black">EMI Calculator</h2>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-black text-lime-300">₹{emi.toLocaleString("en-IN")}</span>
        <span className="mb-1 text-sm text-slate-400">/ month</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Loan {inLakh(loanAmount)} · Total interest {inLakh(totalInterest)}
      </p>

      <div className="mt-5 space-y-4">
        <DarkSlider
          label="Down payment"
          value={downPct} min={5} max={80} step={5}
          badge={`${downPct}% · ${inLakh(downAmount)}`}
          onChange={setDownPct}
        />
        <DarkSlider
          label="Interest rate"
          value={roi} min={6} max={20} step={0.5}
          badge={`${roi.toFixed(1)}% p.a.`}
          onChange={setRoi}
        />
        <DarkSlider
          label="Loan tenure"
          value={tenure} min={12} max={84} step={6}
          badge={`${tenure} months · ${(tenure / 12).toFixed(1)} yr`}
          onChange={setTenure}
        />
      </div>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-lime-400"
      >
        See detailed EMI schedule →
      </Link>
    </div>
  );
}
