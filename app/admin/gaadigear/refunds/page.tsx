import { GearRefundsList } from "@/components/admin/gaadigear/GearRefundsList";
import { getRefundRequestsForAdmin } from "@/lib/services/gear-refunds";

export default async function AdminGearRefundsPage() {
  const refundRequests = await getRefundRequestsForAdmin();
  return <GearRefundsList refundRequests={refundRequests} />;
}
