"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { City, State } from "@/types/automobile";

export function AdminCitiesManager({ cities, states }: { cities: City[]; states: State[] }) {
  const router = useRouter();

  const [editingId, setEditingId] = useState("");
  const [stateId, setStateId] = useState(states[0]?.id ?? "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultRtoId, setDefaultRtoId] = useState("");
  const [tier, setTier] = useState("");
  const [isMetro, setIsMetro] = useState(false);
  const [rtoStateCode, setRtoStateCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const sortedCities = useMemo(
    () =>
      [...cities].sort((a, b) => {
        const sA = states.find((s) => s.id === a.stateId)?.name ?? "";
        const sB = states.find((s) => s.id === b.stateId)?.name ?? "";
        return sA.localeCompare(sB) || a.name.localeCompare(b.name);
      }),
    [cities, states],
  );

  const filteredCities = useMemo(
    () => (stateFilter ? sortedCities.filter((c) => c.stateId === stateFilter) : sortedCities),
    [sortedCities, stateFilter],
  );

  function resetForm() {
    setEditingId("");
    setStateId(states[0]?.id ?? "");
    setName("");
    setSlug("");
    setDefaultRtoId("");
    setTier("");
    setIsMetro(false);
    setRtoStateCode("");
    setError("");
  }

  function startEdit(city: City) {
    setEditingId(city.id);
    setStateId(city.stateId);
    setName(city.name);
    setSlug(city.slug);
    setDefaultRtoId(city.defaultRtoId ?? "");
    setTier(city.tier ?? "");
    setIsMetro(city.isMetro ?? false);
    setRtoStateCode(city.rtoStateCode ?? "");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...(editingId ? { id: editingId } : {}),
      stateId,
      name,
      slug: slug.trim() || undefined,
      defaultRtoId: defaultRtoId.trim() || undefined,
      tier: tier.trim() || undefined,
      isMetro,
      rtoStateCode: rtoStateCode.trim() || undefined,
    };

    try {
      if (editingId) {
        await patchAdminJson("/api/admin/cities", body);
      } else {
        await postAdminJson("/api/admin/cities", body);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save city");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">City management</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{editingId ? "Edit city" : "Add city"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Metro cities are pre-filled in the pricing cache when a new variant is created. Non-metro cities warm lazily on first user visit.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <select
              className={adminFieldClass}
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
              required
            >
              {[...states].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              className={adminFieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="City name"
              required
            />
            <input
              className={adminFieldClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Slug (auto-generated if blank)"
            />
            <input
              className={adminFieldClass}
              value={rtoStateCode}
              onChange={(e) => setRtoStateCode(e.target.value)}
              placeholder="RTO state code (e.g. MH, KA)"
            />
            <input
              className={adminFieldClass}
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              placeholder="Tier (e.g. tier1, tier2)"
            />
            <input
              className={adminFieldClass}
              value={defaultRtoId}
              onChange={(e) => setDefaultRtoId(e.target.value)}
              placeholder="Default RTO ID (UUID, optional)"
            />
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={isMetro} onChange={(e) => setIsMetro(e.target.checked)} type="checkbox" />
              Metro city (pre-fills pricing cache on variant creation)
            </label>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <div className="flex gap-3">
              <button
                className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving…" : editingId ? "Update city" : "Add city"}
              </button>
              {editingId ? (
                <button
                  className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">
              Cities{" "}
              <span className="text-sm font-bold text-slate-500">
                ({filteredCities.length}{stateFilter ? "" : ` of ${cities.length}`})
              </span>
            </h2>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All states</option>
              {[...states].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="border-b border-slate-200 p-3">State</th>
                  <th className="border-b border-slate-200 p-3">City</th>
                  <th className="border-b border-slate-200 p-3">Slug</th>
                  <th className="border-b border-slate-200 p-3">RTO code</th>
                  <th className="border-b border-slate-200 p-3">Tier</th>
                  <th className="border-b border-slate-200 p-3">Metro</th>
                  <th className="border-b border-slate-200 p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city) => {
                  const state = states.find((s) => s.id === city.stateId);
                  const isEditing = editingId === city.id;
                  return (
                    <tr key={city.id} className={isEditing ? "bg-emerald-50" : "hover:bg-slate-50"}>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{state?.name ?? "—"}</td>
                      <td className="border-b border-slate-100 p-3 font-bold text-slate-900">{city.name}</td>
                      <td className="border-b border-slate-100 p-3 font-mono text-xs text-slate-500">{city.slug}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{city.rtoStateCode ?? "—"}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{city.tier ?? "—"}</td>
                      <td className="border-b border-slate-100 p-3">
                        {city.isMetro ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Metro</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="border-b border-slate-100 p-3">
                        <button
                          className="text-sm font-bold text-emerald-700 hover:underline"
                          onClick={() => (isEditing ? resetForm() : startEdit(city))}
                          type="button"
                        >
                          {isEditing ? "Cancel" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
