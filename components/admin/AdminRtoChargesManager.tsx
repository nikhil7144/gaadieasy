"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { City, RtoCharge, RtoOffice, State } from "@/types/automobile";

export function AdminRtoChargesManager({
  cities,
  rtoCharges,
  rtoOffices,
  states,
}: {
  cities: City[];
  rtoCharges: RtoCharge[];
  rtoOffices: RtoOffice[];
  states: State[];
}) {
  const router = useRouter();

  // ── Edit mode (single entry) ──────────────────────────────────────────────
  const [editingId, setEditingId]               = useState("");
  const [editCityId, setEditCityId]             = useState(cities[0]?.id ?? "");
  const [editStateId, setEditStateId]           = useState(cities[0]?.stateId ?? "");
  const [editRtoId, setEditRtoId]               = useState("");

  // ── Create mode (multi-city) ──────────────────────────────────────────────
  const [filterStateId, setFilterStateId]       = useState(states[0]?.id ?? "");
  const [selectedCityIds, setSelectedCityIds]   = useState<Set<string>>(new Set());

  // ── Shared fee fields ─────────────────────────────────────────────────────
  const [registrationFee, setRegistrationFee]   = useState("0");
  const [smartCardFee, setSmartCardFee]         = useState("0");
  const [numberPlateFee, setNumberPlateFee]     = useState("0");
  const [hypothecationFee, setHypothecationFee] = useState("0");
  const [fastagFee, setFastagFee]               = useState("0");
  const [handlingCharges, setHandlingCharges]   = useState("0");
  const [active, setActive]                     = useState(true);

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [bulkResult, setBulkResult] = useState("");

  const cityList = useMemo(
    () =>
      [...cities].sort((a, b) => {
        const stateA = states.find((s) => s.id === a.stateId)?.name ?? "";
        const stateB = states.find((s) => s.id === b.stateId)?.name ?? "";
        return stateA.localeCompare(stateB) || a.name.localeCompare(b.name);
      }),
    [cities, states],
  );

  const citiesInFilterState = useMemo(
    () => cityList.filter((c) => c.stateId === filterStateId),
    [cityList, filterStateId],
  );

  const editRtoOffices = useMemo(
    () => rtoOffices.filter((o) => o.cityId === editCityId),
    [editCityId, rtoOffices],
  );

  function resetFees() {
    setRegistrationFee("0");
    setSmartCardFee("0");
    setNumberPlateFee("0");
    setHypothecationFee("0");
    setFastagFee("0");
    setHandlingCharges("0");
    setActive(true);
    setError("");
    setBulkResult("");
  }

  function cancelEdit() {
    setEditingId("");
    setSelectedCityIds(new Set());
    resetFees();
  }

  function startEdit(charge: RtoCharge) {
    setEditingId(charge.id);
    setSelectedCityIds(new Set());
    setEditCityId(charge.cityId);
    setEditStateId(charge.stateId);
    setEditRtoId(charge.rtoId);
    setRegistrationFee(String(charge.registrationFee));
    setSmartCardFee(String(charge.smartCardFee));
    setNumberPlateFee(String(charge.numberPlateFee));
    setHypothecationFee(String(charge.hypothecationFee));
    setFastagFee(String(charge.fastagFee));
    setHandlingCharges(String(charge.handlingCharges));
    setActive(charge.active);
    setError("");
    setBulkResult("");
  }

  function toggleCity(id: string) {
    setSelectedCityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllInState(checked: boolean) {
    setSelectedCityIds(checked ? new Set(citiesInFilterState.map((c) => c.id)) : new Set());
  }

  const feePayload = () => ({
    registrationFee,
    smartCardFee,
    numberPlateFee,
    hypothecationFee,
    fastagFee,
    handlingCharges,
    active,
  });

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await patchAdminJson("/api/admin/rto-charges", { id: editingId, stateId: editStateId, cityId: editCityId, rtoId: editRtoId, ...feePayload() });
      cancelEdit();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedCityIds.size === 0) { setError("Select at least one city."); return; }
    setSaving(true);
    setError("");
    setBulkResult("");
    let ok = 0;
    const errs: string[] = [];
    for (const cid of Array.from(selectedCityIds)) {
      const city = cities.find((c) => c.id === cid);
      if (!city) continue;
      try {
        await postAdminJson("/api/admin/rto-charges", {
          stateId: city.stateId,
          cityId: cid,
          rtoId: city.defaultRtoId ?? "",
          ...feePayload(),
        });
        ok++;
      } catch (e) {
        errs.push(`${city.name}: ${e instanceof Error ? e.message : "error"}`);
      }
    }
    setSaving(false);
    if (errs.length) {
      setError(errs.join(" | "));
    } else {
      setBulkResult(`✓ Created ${ok} charge set${ok > 1 ? "s" : ""} successfully.`);
      setSelectedCityIds(new Set());
      resetFees();
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[440px_1fr]">

        {/* ── Left: form panel ── */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Registration rules</p>

          {editingId ? (
            <>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Edit RTO charge set</h1>
              <form className="mt-4 grid gap-3" onSubmit={handleUpdate}>
                <select
                  className={adminFieldClass}
                  value={editCityId}
                  onChange={(e) => {
                    const city = cities.find((c) => c.id === e.target.value);
                    setEditCityId(e.target.value);
                    setEditStateId(city?.stateId ?? "");
                    setEditRtoId(city?.defaultRtoId ?? "");
                  }}
                >
                  {cityList.map((city) => {
                    const state = states.find((s) => s.id === city.stateId);
                    return <option key={city.id} value={city.id}>{city.name}, {state?.code}</option>;
                  })}
                </select>
                <select className={adminFieldClass} value={editRtoId} onChange={(e) => setEditRtoId(e.target.value)}>
                  <option value="">Default city RTO</option>
                  {editRtoOffices.map((o) => <option key={o.id} value={o.id}>{o.code} – {o.name}</option>)}
                </select>
                <FeeFields {...{ registrationFee, setRegistrationFee, smartCardFee, setSmartCardFee, numberPlateFee, setNumberPlateFee, hypothecationFee, setHypothecationFee, fastagFee, setFastagFee, handlingCharges, setHandlingCharges, active, setActive }} />
                {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
                <div className="flex gap-3">
                  <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                    {saving ? "Saving…" : "Update charge set"}
                  </button>
                  <button className="rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700" onClick={cancelEdit} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Add RTO charges</h1>
              <p className="mt-1 text-sm text-slate-500">Pick a state, select one or more cities, then set the fees.</p>

              {/* State filter */}
              <div className="mt-4">
                <label className="mb-1 block text-xs font-bold text-slate-600">Filter by state</label>
                <select
                  className={adminFieldClass}
                  value={filterStateId}
                  onChange={(e) => { setFilterStateId(e.target.value); setSelectedCityIds(new Set()); }}
                >
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              {/* City checkboxes */}
              <div className="mt-3 rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black text-slate-700">
                  <input
                    type="checkbox"
                    checked={citiesInFilterState.length > 0 && citiesInFilterState.every((c) => selectedCityIds.has(c.id))}
                    onChange={(e) => toggleAllInState(e.target.checked)}
                  />
                  Select all cities in {states.find((s) => s.id === filterStateId)?.name}
                  <span className="ml-auto font-normal text-slate-400">{selectedCityIds.size} selected</span>
                </label>
                <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
                  {citiesInFilterState.map((city) => (
                    <label key={city.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCityIds.has(city.id)}
                        onChange={() => toggleCity(city.id)}
                      />
                      <span className="font-medium text-slate-800">{city.name}</span>
                      {city.isMetro && <span className="text-[10px] font-black text-emerald-700">Metro</span>}
                    </label>
                  ))}
                  {citiesInFilterState.length === 0 && (
                    <p className="col-span-2 py-3 text-center text-xs text-slate-400">No cities in this state yet.</p>
                  )}
                </div>
              </div>

              <form className="mt-3 grid gap-3" onSubmit={handleBulkCreate}>
                <FeeFields {...{ registrationFee, setRegistrationFee, smartCardFee, setSmartCardFee, numberPlateFee, setNumberPlateFee, hypothecationFee, setHypothecationFee, fastagFee, setFastagFee, handlingCharges, setHandlingCharges, active, setActive }} />
                {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
                {bulkResult ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{bulkResult}</p> : null}
                <button
                  className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:opacity-50"
                  disabled={saving || selectedCityIds.size === 0}
                >
                  {saving ? "Creating…" : selectedCityIds.size === 0 ? "Select cities above" : `Add charges for ${selectedCityIds.size} cit${selectedCityIds.size > 1 ? "ies" : "y"}`}
                </button>
              </form>
            </>
          )}
        </div>

        {/* ── Right: existing charges ── */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Existing RTO charges</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {rtoCharges.map((charge) => {
              const state = states.find((s) => s.id === charge.stateId);
              const city  = cities.find((c) => c.id === charge.cityId);
              const rto   = rtoOffices.find((o) => o.id === charge.rtoId);
              return (
                <button
                  className="rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/30"
                  key={charge.id}
                  onClick={() => startEdit(charge)}
                  type="button"
                >
                  <div className="font-black text-slate-950">{city?.name}, {state?.code}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{rto?.code ?? city?.rtoStateCode ?? state?.code} – {rto?.name ?? "Default city RTO"}</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">{city?.tier ?? "Tier pending"}{city?.isMetro ? " · Metro" : ""}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-slate-50 p-2">Registration: <strong>{charge.registrationFee.toLocaleString("en-IN")}</strong></span>
                    <span className="rounded-md bg-slate-50 p-2">Handling: <strong>{charge.handlingCharges.toLocaleString("en-IN")}</strong></span>
                    <span className="rounded-md bg-slate-50 p-2">Plate: <strong>{charge.numberPlateFee.toLocaleString("en-IN")}</strong></span>
                    <span className="rounded-md bg-slate-50 p-2">FASTag: <strong>{charge.fastagFee.toLocaleString("en-IN")}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeeFields({
  registrationFee, setRegistrationFee,
  smartCardFee, setSmartCardFee,
  numberPlateFee, setNumberPlateFee,
  hypothecationFee, setHypothecationFee,
  fastagFee, setFastagFee,
  handlingCharges, setHandlingCharges,
  active, setActive,
}: {
  registrationFee: string; setRegistrationFee: (v: string) => void;
  smartCardFee: string;    setSmartCardFee: (v: string) => void;
  numberPlateFee: string;  setNumberPlateFee: (v: string) => void;
  hypothecationFee: string; setHypothecationFee: (v: string) => void;
  fastagFee: string;       setFastagFee: (v: string) => void;
  handlingCharges: string; setHandlingCharges: (v: string) => void;
  active: boolean;         setActive: (v: boolean) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={adminFieldClass} value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} placeholder="Registration fee" />
        <input className={adminFieldClass} value={smartCardFee}    onChange={(e) => setSmartCardFee(e.target.value)}    placeholder="Smart card fee" />
        <input className={adminFieldClass} value={numberPlateFee}  onChange={(e) => setNumberPlateFee(e.target.value)}  placeholder="Number plate fee" />
        <input className={adminFieldClass} value={hypothecationFee} onChange={(e) => setHypothecationFee(e.target.value)} placeholder="Hypothecation fee" />
        <input className={adminFieldClass} value={fastagFee}        onChange={(e) => setFastagFee(e.target.value)}       placeholder="FASTag fee" />
        <input className={adminFieldClass} value={handlingCharges}  onChange={(e) => setHandlingCharges(e.target.value)} placeholder="Handling charges" />
      </div>
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <input checked={active} onChange={(e) => setActive(e.target.checked)} type="checkbox" />
        Active charge set
      </label>
    </>
  );
}
