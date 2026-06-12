"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { State, StateTaxRule, VehicleCategory } from "@/types/automobile";

const fuelOptions = ["", "Petrol", "Diesel", "CNG", "Hybrid", "Electric"] as const;

export function AdminTaxRulesManager({
  categories,
  states,
  taxRules,
}: {
  categories: VehicleCategory[];
  states: State[];
  taxRules: StateTaxRule[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string>("");
  const [stateId, setStateId] = useState(states[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [fuelType, setFuelType] = useState("");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("");
  const [roadTaxPercent, setRoadTaxPercent] = useState("0");
  const [fixedTaxAmount, setFixedTaxAmount] = useState("0");
  const [evExemptionPercent, setEvExemptionPercent] = useState("0");
  const [luxuryCessPercent, setLuxuryCessPercent] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sortedRules = useMemo(
    () =>
      [...taxRules].sort((a, b) => {
        const stateA = states.find((item) => item.id === a.stateId)?.name ?? "";
        const stateB = states.find((item) => item.id === b.stateId)?.name ?? "";
        return stateA.localeCompare(stateB) || a.minPrice - b.minPrice;
      }),
    [states, taxRules],
  );

  function resetForm() {
    setEditingId("");
    setStateId(states[0]?.id ?? "");
    setCategoryId(categories[0]?.id ?? "");
    setFuelType("");
    setMinPrice("0");
    setMaxPrice("");
    setRoadTaxPercent("0");
    setFixedTaxAmount("0");
    setEvExemptionPercent("0");
    setLuxuryCessPercent("0");
    setActive(true);
    setError("");
  }

  function startEdit(rule: StateTaxRule) {
    setEditingId(rule.id);
    setStateId(rule.stateId);
    setCategoryId(rule.categoryId);
    setFuelType(rule.fuelType ?? "");
    setMinPrice(String(rule.minPrice));
    setMaxPrice(rule.maxPrice ? String(rule.maxPrice) : "");
    setRoadTaxPercent(String(rule.roadTaxPercent));
    setFixedTaxAmount(String(rule.fixedTaxAmount));
    setEvExemptionPercent(String(rule.evExemptionPercent));
    setLuxuryCessPercent(String(rule.luxuryCessPercent));
    setActive(rule.active);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...(editingId ? { id: editingId } : {}),
      stateId,
      categoryId,
      fuelType,
      minPrice,
      maxPrice,
      roadTaxPercent,
      fixedTaxAmount,
      evExemptionPercent,
      luxuryCessPercent,
      active,
    };

    try {
      if (editingId) {
        await patchAdminJson("/api/admin/tax-rules", body);
      } else {
        await postAdminJson("/api/admin/tax-rules", body);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save tax rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Pricing rules</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{editingId ? "Edit tax rule" : "Create tax rule"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            City is the customer selector, but tax rules are stored state-wise and category-wise. Use fuel only when that state treats fuel types differently.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <select className={adminFieldClass} value={stateId} onChange={(event) => setStateId(event.target.value)}>
              {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
            </select>
            <select className={adminFieldClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select className={adminFieldClass} value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
              {fuelOptions.map((option) => <option key={option || "any"} value={option}>{option || "Any fuel type"}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={adminFieldClass} value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" />
              <input className={adminFieldClass} value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price optional" />
              <input className={adminFieldClass} value={roadTaxPercent} onChange={(event) => setRoadTaxPercent(event.target.value)} placeholder="Road tax %" />
              <input className={adminFieldClass} value={fixedTaxAmount} onChange={(event) => setFixedTaxAmount(event.target.value)} placeholder="Fixed tax amount" />
              <input className={adminFieldClass} value={evExemptionPercent} onChange={(event) => setEvExemptionPercent(event.target.value)} placeholder="EV relief %" />
              <input className={adminFieldClass} value={luxuryCessPercent} onChange={(event) => setLuxuryCessPercent(event.target.value)} placeholder="Luxury cess %" />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
              Active rule
            </label>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <div className="flex gap-3">
              <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                {saving ? "Saving" : editingId ? "Update rule" : "Add rule"}
              </button>
              {editingId ? (
                <button className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700" onClick={resetForm} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Existing tax slabs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="border-b border-slate-200 p-3">State</th>
                  <th className="border-b border-slate-200 p-3">Category</th>
                  <th className="border-b border-slate-200 p-3">Fuel</th>
                  <th className="border-b border-slate-200 p-3">Price slab</th>
                  <th className="border-b border-slate-200 p-3">Road tax</th>
                  <th className="border-b border-slate-200 p-3">Fixed</th>
                  <th className="border-b border-slate-200 p-3">Status</th>
                  <th className="border-b border-slate-200 p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.map((rule) => {
                  const state = states.find((item) => item.id === rule.stateId);
                  const category = categories.find((item) => item.id === rule.categoryId);
                  return (
                    <tr key={rule.id}>
                      <td className="border-b border-slate-100 p-3 font-bold text-slate-950">{state?.name ?? "Unknown"}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{category?.name ?? "Unknown"}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{rule.fuelType ?? "Any"}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{rule.minPrice.toLocaleString("en-IN")} - {rule.maxPrice ? rule.maxPrice.toLocaleString("en-IN") : "Above"}</td>
                      <td className="border-b border-slate-100 p-3 font-black text-emerald-800">{rule.roadTaxPercent}%</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{rule.fixedTaxAmount.toLocaleString("en-IN")}</td>
                      <td className="border-b border-slate-100 p-3 text-slate-600">{rule.active ? "Active" : "Inactive"}</td>
                      <td className="border-b border-slate-100 p-3">
                        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700 hover:border-emerald-300 hover:bg-emerald-50" onClick={() => startEdit(rule)} type="button">
                          Edit
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
