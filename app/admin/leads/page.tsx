import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { describeAssignedDealer, getAdminLeads } from "@/lib/services/leads";
import { formatIndianPrice } from "@/lib/utils/format";

export default async function AdminLeadsPage() {
  const [leads, data] = await Promise.all([getAdminLeads(), getVehicleDataSet()]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-emerald-700">Lead queue</p>
      <h1 className="mt-1 text-2xl font-black text-slate-950">Leads</h1>
      <p className="mt-2 text-sm text-slate-600">Supabase-backed buyer enquiries with dealer routing visibility.</p>
      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {leads.length ? leads.map((lead) => (
          <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]" key={lead.id}>
            <div>
              <div className="font-black text-slate-950">{lead.name}</div>
              <div className="text-sm text-slate-500">{lead.phone}</div>
              <div className="mt-1 text-xs font-bold uppercase text-slate-400">
                {describeAssignedDealer(lead, data.dealers)}
              </div>
            </div>
            <div className="text-sm font-black text-emerald-800">{formatIndianPrice(lead.selectedOnRoadPrice)}</div>
          </div>
        )) : (
          <div className="p-4 text-sm font-bold text-slate-500">No leads yet.</div>
        )}
      </div>
    </section>
  );
}
