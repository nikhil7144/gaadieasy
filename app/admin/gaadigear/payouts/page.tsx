import { GearPayoutsRun } from "@/components/admin/gaadigear/GearPayoutsRun";
import { getPayoutPreview } from "@/lib/services/gear-payouts";

export default async function AdminGearPayoutsPage() {
  const preview = await getPayoutPreview();
  return <GearPayoutsRun preview={preview} />;
}
