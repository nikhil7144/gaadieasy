"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { InsuranceRule, VehicleCategory } from "@/types/automobile";

const FUEL_TYPES = ["", "Petrol", "Diesel", "CNG", "Hybrid", "Electric"] as const;

export function AdminInsuranceManager({
  categories,
  insuranceRules,
}: {
  categories: VehicleCategory[];
  insuranceRules: InsuranceRule[];
}) {
  const router = useRouter();
  const [editingId, setEditingId]                       = useState("");
  const [categoryId, setCategoryId]                     = useState(categories[0]?.id ?? "");
  const [fuelType, setFuelType]                         = useState<string>("");
  const [percentOfExShowroom, setPercentOfExShowroom]   = useState("3.5");
  const [fixedAmount, setFixedAmount]                   = useState("0");
  const [active, setActive]                             = useState(true);
  const [saving, setSaving]                             = useState(false);
  const [error, setError]                               = useState("");

  function resetForm() {
    setEditingId("");
    setCategoryId(categories[0]?.id ?? "");
    setFuelType("");
    setPercentOfExShowroom("3.5");
    setFixedAmount("0");
    setActive(true);
    setError("");
  }

  function startEdit(rule: InsuranceRule) {
    setEditingId(rule.id);
    setCategoryId(rule.categoryId);
    setFuelType(rule.fuelType ?? "");
    setPercentOfExShowroom(String(rule.percentOfExShowroom));
    setFixedAmount(String(rule.fixedAmount));
    setActive(rule.active);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      ...(editingId ? { id: editingId } : {}),
      categoryId,
      fuelType,
      percentOfExShowroom,
      fixedAmount,
      active,
    };
    try {
      if (editingId) {
        await patchAdminJson("/api/admin/insurance", body);
      } else {
        await postAdminJson("/api/admin/insurance", body);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save insurance rule");
    } finally {
      setSaving(false);
    }
  }

  const totalFee = (price: number) =>
    Math.round(price * (parseFloat(percentOfExShowroom || "0") / 100) + parseFloat(fixedAmount || "0"));

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Insurance rules</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{editingId ? "Edit rule" : "Add insurance rule"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Insurance = <strong>% of ex-showroom</strong> + <strong>fixed amount</strong>.
            Optionally scope to a specific fuel type within a category.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Vehicle category</label>
              <select className={adminFieldClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Fuel type (optional — leave blank to apply to all)</label>
              <select className={adminFieldClass} value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>{ft || "All fuel types"}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">% of ex-showroom price</label>
                <input
                  className={adminFieldClass}
                  value={percentOfExShowroom}
                  onChange={(e) => setPercentOfExShowroom(e.target.value)}
                  placeholder="e.g. 3.5"
                  step="0.1"
                  type="number"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Fixed amount (₹)</label>
                <input
                  className={adminFieldClass}
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  type="number"
                  min="0"
                />
              </div>
            </div>

            <div className="rounded-lg bg-lime-50 p-3 text-sm">
              <p className="font-bold text-slate-700">Preview on ₹10 L ex-showroom:</p>
              <p className="mt-1 font-black text-emerald-800">₹{totalFee(1_000_000).toLocaleString("en-IN")}</p>
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={active} onChange={(e) => setActive(e.target.checked)} type="checkbox" />
              Active rule
            </label>

            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}

            <div className="flex gap-3">
              <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update rule" : "Add rule"}
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
          <h2 className="text-xl font-black text-slate-950">Insurance rules ({insuranceRules.length})</h2>
          <p className="mt-1 text-sm text-slate-500">Formula: <code className="rounded bg-slate-100 px-1">insurance = ex-showroom × % + fixed</code></p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insuranceRules.map((rule) => {
              const cat = categories.find((c) => c.id === rule.categoryId);
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => startEdit(rule)}
                  className="rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-950">{cat?.name ?? rule.categoryId}</span>
                    {!rule.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">INACTIVE</span>}
                  </div>
                  {rule.fuelType && (
                    <div className="mt-1 text-xs font-bold text-emerald-700">{rule.fuelType} only</div>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-slate-50 p-2">Rate: <strong>{rule.percentOfExShowroom}%</strong></span>
                    <span className="rounded-md bg-slate-50 p-2">Fixed: <strong>₹{rule.fixedAmount.toLocaleString("en-IN")}</strong></span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    On ₹10 L: <strong className="text-slate-950">₹{Math.round(1_000_000 * rule.percentOfExShowroom / 100 + rule.fixedAmount).toLocaleString("en-IN")}</strong>
                  </div>
                </button>
              );
            })}
            {insuranceRules.length === 0 && (
              <p className="col-span-2 py-6 text-center text-sm text-slate-500">No insurance rules yet. Add one using the form.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
