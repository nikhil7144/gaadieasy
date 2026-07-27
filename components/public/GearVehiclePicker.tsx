"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function GearVehiclePicker({ models }: { models: { id: string; name: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return models.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, models]);

  return (
    <div className="relative mx-auto max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search className="text-slate-400" size={18} />
        <input
          className="min-h-12 w-full bg-transparent text-sm font-bold text-slate-950 outline-none"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. KTM Duke 390"
          value={query}
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {matches.map((m) => (
            <button
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-bold text-slate-800 hover:bg-emerald-50"
              key={m.id}
              onClick={() => router.push(`/gaadigear/products?model_id=${m.id}`)}
              type="button"
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
