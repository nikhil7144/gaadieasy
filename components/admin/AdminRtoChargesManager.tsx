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
  const [editingId, setEditingId] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [stateId, setStateId] = useState(cities[0]?.stateId ?? states[0]?.id ?? "");
  const [rtoId, setRtoId] = useState("");
  const [registrationFee, setRegistrationFee] = useState("0");
  const [smartCardFee, setSmartCardFee] = useState("0");
  const [numberPlateFee, setNumberPlateFee] = useState("0");
  const [hypothecationFee, setHypothecationFee] = useState("0");
  const [fastagFee, setFastagFee] = useState("0");
  const [handlingCharges, setHandlingCharges] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cityList = useMemo(
    () =>
      [...cities].sort((a, b) => {
        const stateA = states.find((item) => item.id === a.stateId)?.name ?? "";
        const stateB = states.find((item) => item.id === b.stateId)?.name ?? "";
        return stateA.localeCompare(stateB) || a.name.localeCompare(b.name);
      }),
    [cities, states],
  );

  const visibleRtoOffices = useMemo(() => rtoOffices.filter((office) => office.cityId === cityId), [cityId, rtoOffices]);

  function resetForm() {
    setEditingId("");
    setCityId(cities[0]?.id ?? "");
    setStateId(cities[0]?.stateId ?? states[0]?.id ?? "");
    setRtoId(cities[0]?.defaultRtoId ?? "");
    setRegistrationFee("0");
    setSmartCardFee("0");
    setNumberPlateFee("0");
    setHypothecationFee("0");
    setFastagFee("0");
    setHandlingCharges("0");
    setActive(true);
    setError("");
  }

  function handleCityChange(nextCityId: string) {
    setCityId(nextCityId);
    const city = cities.find((item) => item.id === nextCityId);
    setStateId(city?.stateId ?? "");
    setRtoId(city?.defaultRtoId ?? "");
  }

  function startEdit(charge: RtoCharge) {
    setEditingId(charge.id);
    setCityId(charge.cityId);
    setStateId(charge.stateId);
    setRtoId(charge.rtoId);
    setRegistrationFee(String(charge.registrationFee));
    setSmartCardFee(String(charge.smartCardFee));
    setNumberPlateFee(String(charge.numberPlateFee));
    setHypothecationFee(String(charge.hypothecationFee));
    setFastagFee(String(charge.fastagFee));
    setHandlingCharges(String(charge.handlingCharges));
    setActive(charge.active);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...(editingId ? { id: editingId } : {}),
      stateId,
      cityId,
      rtoId,
      registrationFee,
      smartCardFee,
      numberPlateFee,
      hypothecationFee,
      fastagFee,
      handlingCharges,
      active,
    };

    try {
      if (editingId) {
        await patchAdminJson("/api/admin/rto-charges", body);
      } else {
        await postAdminJson("/api/admin/rto-charges", body);
      }
      resetForm();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save RTO charge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-emerald-700">Registration rules</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{editingId ? "Edit RTO charge set" : "Create RTO charge set"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            These are practical city/RTO costs on top of state-based road tax. Use them to tune registration, number plate, hypothecation and local handling.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <select className={adminFieldClass} value={cityId} onChange={(event) => handleCityChange(event.target.value)}>
              {cityList.map((city) => {
                const state = states.find((item) => item.id === city.stateId);
                return <option key={city.id} value={city.id}>{city.name}, {state?.code}</option>;
              })}
            </select>
            <select className={adminFieldClass} value={rtoId} onChange={(event) => setRtoId(event.target.value)}>
              <option value="">Default city RTO</option>
              {visibleRtoOffices.map((office) => <option key={office.id} value={office.id}>{office.code} - {office.name}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={adminFieldClass} value={registrationFee} onChange={(event) => setRegistrationFee(event.target.value)} placeholder="Registration fee" />
              <input className={adminFieldClass} value={smartCardFee} onChange={(event) => setSmartCardFee(event.target.value)} placeholder="Smart card fee" />
              <input className={adminFieldClass} value={numberPlateFee} onChange={(event) => setNumberPlateFee(event.target.value)} placeholder="Number plate fee" />
              <input className={adminFieldClass} value={hypothecationFee} onChange={(event) => setHypothecationFee(event.target.value)} placeholder="Hypothecation fee" />
              <input className={adminFieldClass} value={fastagFee} onChange={(event) => setFastagFee(event.target.value)} placeholder="FASTag fee" />
              <input className={adminFieldClass} value={handlingCharges} onChange={(event) => setHandlingCharges(event.target.value)} placeholder="Handling charges" />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
              Active charge set
            </label>
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <div className="flex gap-3">
              <button className="rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400" disabled={saving}>
                {saving ? "Saving" : editingId ? "Update charge set" : "Add charge set"}
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
          <h2 className="text-xl font-black text-slate-950">Existing RTO charges</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {rtoCharges.map((charge) => {
              const state = states.find((item) => item.id === charge.stateId);
              const city = cities.find((item) => item.id === charge.cityId);
              const rto = rtoOffices.find((item) => item.id === charge.rtoId);
              return (
                <button className="rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/30" key={charge.id} onClick={() => startEdit(charge)} type="button">
                  <div className="font-black text-slate-950">{city?.name}, {state?.code}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{rto?.code ?? city?.rtoStateCode ?? state?.code} - {rto?.name ?? "Default city RTO"}</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">{city?.tier ?? "Tier pending"}{city?.isMetro ? " • Metro" : ""}</div>
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
