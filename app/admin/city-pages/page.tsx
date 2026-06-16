import { AdminCityPagesManager } from "@/components/admin/AdminCityPagesManager";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminCityPagesPage() {
  const { brands, categories, cities, cityPages } = await getVehicleDataSet();

  return (
    <AdminCityPagesManager
      brands={brands.filter((brand) => brand.active)}
      categories={categories}
      cities={[...cities].sort((a, b) => a.name.localeCompare(b.name))}
      cityPages={cityPages}
    />
  );
}
