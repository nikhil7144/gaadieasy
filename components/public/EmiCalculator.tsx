"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp, Calendar, IndianRupee, Car } from "lucide-react";
import { calcEmi as calcEmiUtil } from "@/lib/utils/emi";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─── types ───────────────────────────────────────────────────────────────────

type MonthRow = { month: number; emi: number; principal: number; interest: number; balance: number };
type YearRow  = { year: number; principal: number; interest: number; total: number; closingBalance: number };

// ─── types ─────────────────────────────────────────────────────────────────── (continued)

export type EmiVariantOption = { id: string; name: string; onRoadPrice: number };

// ─── math ────────────────────────────────────────────────────────────────────

const calcEmi = calcEmiUtil;

function buildSchedule(loanAmount: number, annualRatePct: number, emi: number, tenure: number): MonthRow[] {
  const rows: MonthRow[] = [];
  let balance = loanAmount;
  const r = annualRatePct / 12 / 100;
  for (let m = 1; m <= tenure; m++) {
    const interest  = Math.round(balance * r);
    const principal = Math.round(Math.min(emi - interest, balance));
    balance         = Math.max(0, balance - principal);
    rows.push({ month: m, emi, interest, principal, balance: Math.round(balance) });
  }
  return rows;
}

function buildYearRows(schedule: MonthRow[]): YearRow[] {
  const numYears = Math.ceil(schedule.length / 12);
  return Array.from({ length: numYears }, (_, i) => {
    const slice = schedule.slice(i * 12, (i + 1) * 12);
    return {
      year:           i + 1,
      principal:      slice.reduce((s, r) => s + r.principal, 0),
      interest:       slice.reduce((s, r) => s + r.interest, 0),
      total:          slice.reduce((s, r) => s + r.emi, 0),
      closingBalance: slice[slice.length - 1]?.balance ?? 0,
    };
  });
}

// ─── formatters ──────────────────────────────────────────────────────────────

function inLakh(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function rupees(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// ─── slider ──────────────────────────────────────────────────────────────────

function EmiSlider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; display: (v: number) => string; onChange: (v: number) => void;
}) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-700">{display(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          accentColor: "#10b981",
          background: `linear-gradient(to right, #10b981 ${pct}%, #e2e8f0 ${pct}%)`,
          borderRadius: "9999px",
          height: "6px",
          outline: "none",
          appearance: "auto",
        }}
      />
      <div className="flex justify-between text-[11px] font-bold text-slate-400">
        <span>{display(min)}</span>
        <span>{display(max)}</span>
      </div>
    </div>
  );
}

// ─── custom pie label ─────────────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number;
}) {
  const RADIAN = Math.PI / 180;
  const safeCx = cx ?? 0; const safeCy = cy ?? 0;
  const safeMA = midAngle ?? 0; const safeIR = innerRadius ?? 0; const safeOR = outerRadius ?? 0;
  const radius = safeIR + (safeOR - safeIR) * 0.55;
  const x = safeCx + radius * Math.cos(-safeMA * RADIAN);
  const y = safeCy + radius * Math.sin(-safeMA * RADIAN);
  if ((percent ?? 0) < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-black" fontSize={12} fontWeight={900}>
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function EmiCalculator({
  defaultVehiclePrice = 1_000_000,
  vehicleName,
  variants = [],
  defaultVariantId,
}: {
  defaultVehiclePrice?: number;
  vehicleName?: string;
  variants?: EmiVariantOption[];
  defaultVariantId?: string;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId ?? variants[0]?.id ?? "");
  const [vehiclePrice, setVehiclePrice]   = useState(defaultVehiclePrice);
  const [downPayment,  setDownPayment]    = useState(Math.round(defaultVehiclePrice * 0.2));
  const [roi,          setRoi]            = useState(9.5);
  const [tenure,       setTenure]         = useState(60);
  const [showSchedule, setShowSchedule]   = useState(false);
  const [mounted,      setMounted]        = useState(false);

  function selectVariant(id: string) {
    const v = variants.find((item) => item.id === id);
    if (!v) return;
    setSelectedVariantId(id);
    setVehiclePrice(v.onRoadPrice);
    setDownPayment(Math.round(v.onRoadPrice * 0.2));
  }

  useEffect(() => { setMounted(true); }, []);

  const maxDown = vehiclePrice;
  const safeDown = Math.min(downPayment, maxDown);

  const loanAmount  = Math.max(0, vehiclePrice - safeDown);
  const emi         = useMemo(() => calcEmi(loanAmount, roi, tenure), [loanAmount, roi, tenure]);
  const totalPayment = emi * tenure;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const schedule   = useMemo(() => buildSchedule(loanAmount, roi, emi, tenure), [loanAmount, roi, emi, tenure]);
  const yearRows   = useMemo(() => buildYearRows(schedule),                       [schedule]);
  const firstFive  = yearRows.slice(0, 5);

  const pieData = [
    { name: "Principal",      value: loanAmount,     color: "#10b981" },
    { name: "Total interest", value: totalInterest,  color: "#f59e0b" },
  ];

  const barData = firstFive.map((y) => ({
    name:      `Year ${y.year}`,
    Principal: y.principal,
    Interest:  y.interest,
  }));

  const ordinal = ["1st", "2nd", "3rd", "4th", "5th"];

  return (
    <div className="space-y-8">
      {/* variant selector */}
      {variants.length > 1 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <Car size={15} className="text-emerald-600" /> Select variant
          </label>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-950 focus:border-emerald-400 focus:outline-none"
            value={selectedVariantId}
            onChange={(e) => selectVariant(e.target.value)}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — ₹{v.onRoadPrice.toLocaleString("en-IN")} on-road
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {vehicleName ? (
        <p className="text-sm font-bold text-slate-500">Calculating for <strong className="text-slate-950">{vehicleName}</strong></p>
      ) : null}

      {/* ── sliders ── */}
      <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <EmiSlider
          label="Vehicle price"
          value={vehiclePrice}
          min={200_000} max={10_000_000} step={50_000}
          display={inLakh}
          onChange={(v) => {
            setVehiclePrice(v);
            setDownPayment((prev) => Math.min(prev, v));
          }}
        />
        <EmiSlider
          label="Down payment"
          value={safeDown}
          min={0} max={maxDown} step={10_000}
          display={inLakh}
          onChange={setDownPayment}
        />
        <EmiSlider
          label="Rate of interest (per annum)"
          value={roi}
          min={5} max={24} step={0.1}
          display={(v) => `${v.toFixed(1)}%`}
          onChange={setRoi}
        />
        <EmiSlider
          label="Loan tenure"
          value={tenure}
          min={12} max={84} step={6}
          display={(v) => `${v} months (${(v / 12).toFixed(1)} yr)`}
          onChange={setTenure}
        />
      </div>

      {/* ── summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-950 p-5 text-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-lime-300">
            <IndianRupee size={13} /> Monthly EMI
          </p>
          <p className="mt-2 text-3xl font-black">{rupees(emi)}</p>
          <p className="mt-1 text-xs text-slate-400">for {tenure} months</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Loan amount</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{inLakh(loanAmount)}</p>
          <p className="mt-1 text-xs text-slate-500">After {inLakh(safeDown)} down payment</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            <TrendingUp size={13} /> Total interest
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{inLakh(totalInterest)}</p>
          <p className="mt-1 text-xs text-amber-700">{loanAmount > 0 ? `${((totalInterest / loanAmount) * 100).toFixed(0)}% of principal` : "—"}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <TrendingDown size={13} /> Total payment
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">{inLakh(totalPayment)}</p>
          <p className="mt-1 text-xs text-slate-500">Principal + interest</p>
        </div>
      </div>

      {/* ── charts ── */}
      {mounted && loanAmount > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-black text-slate-950">Principal vs interest split</h3>
            <p className="mt-0.5 text-xs text-slate-500">Total repayment breakdown</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={105}
                  dataKey="value"
                  labelLine={false}
                  label={(props) => <PieLabel {...props} />}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={(v) => rupees(Number(v ?? 0))} />
                <Legend
                  formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-black text-slate-950">Year-wise repayment</h3>
            <p className="mt-0.5 text-xs text-slate-500">First {firstFive.length} years — principal vs interest paid</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} />
                <YAxis tickFormatter={(v) => `₹${(v / 100_000).toFixed(0)}L`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <ReTooltip formatter={(v, name) => [rupees(Number(v ?? 0)), String(name ?? "")]} />
                <Legend formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>} />
                <Bar dataKey="Principal" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Interest"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* ── year-by-year breakdown ── */}
      {loanAmount > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-black text-slate-950">Year-by-year repayment breakdown</h3>
            <p className="mt-0.5 text-xs text-slate-500">First year total, then annual principal + interest split</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">Year</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-500">EMIs paid</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-emerald-700">Principal</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-amber-600">Interest</th>
                  <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-500">Closing balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {firstFive.map((row, i) => (
                  <tr key={row.year} className={i === 0 ? "bg-lime-50" : "hover:bg-slate-50"}>
                    <td className="px-5 py-3 font-black text-slate-950">
                      {ordinal[i]} year
                      {i === 0 ? <span className="ml-2 rounded-full bg-lime-300 px-2 py-0.5 text-[10px] font-black text-slate-950">Total: {rupees(row.total)}</span> : null}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-700">{row.total < 1 ? "—" : rupees(row.total)}</td>
                    <td className="px-5 py-3 text-right font-black text-emerald-700">{rupees(row.principal)}</td>
                    <td className="px-5 py-3 text-right font-black text-amber-600">{rupees(row.interest)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-700">{row.closingBalance > 0 ? rupees(row.closingBalance) : <span className="text-emerald-600">Paid off</span>}</td>
                  </tr>
                ))}
                {yearRows.length > 5 ? (
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="px-5 py-2 text-center text-xs font-bold text-slate-400">
                      +{yearRows.length - 5} more year{yearRows.length - 5 !== 1 ? "s" : ""} — see EMI schedule below
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── emi schedule ── */}
      {loanAmount > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            onClick={() => setShowSchedule((s) => !s)}
          >
            <div>
              <h3 className="text-base font-black text-slate-950">See EMI schedule</h3>
              <p className="mt-0.5 text-xs text-slate-500">Month-by-month payment breakdown for all {tenure} months</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600">
              {showSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {showSchedule ? (
            <div className="border-t border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">Month</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-500">EMI</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-emerald-700">Principal</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-amber-600">Interest</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {schedule.map((row) => {
                      const isYearEnd = row.month % 12 === 0;
                      return (
                        <tr key={row.month} className={isYearEnd ? "bg-emerald-50/60 font-bold" : "hover:bg-slate-50"}>
                          <td className="px-4 py-2.5 text-slate-700">
                            Month {row.month}
                            {isYearEnd ? <span className="ml-2 text-[10px] font-black text-emerald-700">Year {row.month / 12} end</span> : null}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-900">{rupees(row.emi)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-700">{rupees(row.principal)}</td>
                          <td className="px-4 py-2.5 text-right text-amber-600">{rupees(row.interest)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-700">{row.balance > 0 ? rupees(row.balance) : <span className="font-black text-emerald-600">₹0</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {loanAmount === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
          <Calendar className="mx-auto text-emerald-500" size={32} />
          <p className="mt-3 font-black text-emerald-800">No loan required</p>
          <p className="mt-1 text-sm text-emerald-700">Down payment covers the full vehicle price.</p>
        </div>
      ) : null}
    </div>
  );
}
