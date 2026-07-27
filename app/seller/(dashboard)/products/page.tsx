import { SellerProductsManager } from "@/components/seller/SellerProductsManager";
import { getSellerAccessContext } from "@/lib/services/seller-auth";
import { getProductsForSeller } from "@/lib/services/seller-catalog";

// Auth/status gating already happened in the (dashboard) layout.
export default async function SellerProductsPage() {
  const context = await getSellerAccessContext();
  if (!context) return null;

  const products = await getProductsForSeller(context.seller.id);

  return <SellerProductsManager products={products} />;
}
