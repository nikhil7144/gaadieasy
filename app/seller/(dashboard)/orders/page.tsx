import { SellerShipmentsManager } from "@/components/seller/SellerShipmentsManager";
import { getShipmentsForSeller } from "@/lib/services/gear-fulfillment";
import { getSellerAccessContext } from "@/lib/services/seller-auth";

export default async function SellerOrdersPage() {
  const context = await getSellerAccessContext();
  if (!context) return null;

  const shipments = await getShipmentsForSeller(context.seller.id);
  return <SellerShipmentsManager shipments={shipments} />;
}
