import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminRtoChargesPage() {
  const { cities, rtoCharges, rtoOffices, states } = await getVehicleDataSet();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Registration rules</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">RTO charges</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Registration costs should remain city/RTO based: registration fee, smart card, number plate, hypothecation,
          FASTag and dealer handling charges. These stay separate from percentage-based state tax.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Existing RTO charges</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {rtoCharges.map((charge) => {
            const state = states.find((item) => item.id === charge.stateId);
            const city = cities.find((item) => item.id === charge.cityId);
            const rto = rtoOffices.find((item) => item.id === charge.rtoId);
            return (
              <div className="rounded-lg border border-slate-200 p-3" key={charge.id}>
                <div className="font-black text-slate-950">{city?.name}, {state?.code}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{rto?.code} - {rto?.name}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-md bg-slate-50 p-2">Registration: <strong>{charge.registrationFee.toLocaleString("en-IN")}</strong></span>
                  <span className="rounded-md bg-slate-50 p-2">Handling: <strong>{charge.handlingCharges.toLocaleString("en-IN")}</strong></span>
                  <span className="rounded-md bg-slate-50 p-2">Plate: <strong>{charge.numberPlateFee.toLocaleString("en-IN")}</strong></span>
                  <span className="rounded-md bg-slate-50 p-2">FASTag: <strong>{charge.fastagFee.toLocaleString("en-IN")}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
