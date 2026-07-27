import { GearSellersList } from "@/components/admin/gaadigear/GearSellersList";
import { getSellers } from "@/lib/services/gear-admin";

export default async function AdminGearSellersPage() {
  const sellers = await getSellers();
  return <GearSellersList sellers={sellers} />;
}
