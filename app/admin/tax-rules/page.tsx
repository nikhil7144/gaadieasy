import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminTaxRulesPage() {
  const { categories, states, taxRules } = await getVehicleDataSet();

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Pricing rules</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">State tax rules</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Tax should be configured as rule slabs: state, vehicle category, optional fuel type, price range, road tax
          percent, fixed tax amount, EV exemption and luxury cess. The pricing engine then chooses the matching active
          rule for the selected city and variant.
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Existing tax slabs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-slate-200 p-3">State</th>
                <th className="border-b border-slate-200 p-3">Category</th>
                <th className="border-b border-slate-200 p-3">Fuel</th>
                <th className="border-b border-slate-200 p-3">Price slab</th>
                <th className="border-b border-slate-200 p-3">Road tax</th>
                <th className="border-b border-slate-200 p-3">EV relief</th>
                <th className="border-b border-slate-200 p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {taxRules.map((rule) => {
                const state = states.find((item) => item.id === rule.stateId);
                const category = categories.find((item) => item.id === rule.categoryId);
                return (
                  <tr key={rule.id}>
                    <td className="border-b border-slate-100 p-3 font-bold text-slate-950">{state?.name ?? "Unknown"}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600">{category?.name ?? "Unknown"}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600">{rule.fuelType ?? "Any"}</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600">
                      {rule.minPrice.toLocaleString("en-IN")} - {rule.maxPrice ? rule.maxPrice.toLocaleString("en-IN") : "Above"}
                    </td>
                    <td className="border-b border-slate-100 p-3 font-black text-emerald-800">{rule.roadTaxPercent}%</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600">{rule.evExemptionPercent}%</td>
                    <td className="border-b border-slate-100 p-3 text-slate-600">{rule.active ? "Active" : "Inactive"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
