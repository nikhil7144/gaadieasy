"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Props = {
  defaultQ?: string;
  defaultCity?: string;
  defaultBrand?: string;
  brands?: string[];
};

export function ExperienceSearchBar({ defaultQ = "", defaultCity = "", defaultBrand = "", brands = [] }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [brand, setBrand] = useState(defaultBrand);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (brand) params.set("brand", brand);
    router.push(`/experiences${params.toString() ? `?${params}` : ""}`);
  }

  const inp = "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`${inp} w-full pl-9`}
          placeholder="Dealer name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <input
        className={`${inp} w-36`}
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <select className={`${inp} w-44`} value={brand} onChange={(e) => setBrand(e.target.value)}>
        <option value="">All brands</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-lime-400"
      >
        Search
      </button>
    </form>
  );
}
