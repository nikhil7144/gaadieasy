import { AdminTaxRulesManager } from "@/components/admin/AdminTaxRulesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminTaxRulesPage() {
  const { categories, states, taxRules } = await getVehicleDataSet();
  return <AdminTaxRulesManager categories={categories} states={states} taxRules={taxRules} />;
}
