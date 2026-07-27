import { cardClass, microLabelClass, statValueClass } from "@/components/seller/dashboardStyles";
import { getSellerAccessContext } from "@/lib/services/seller-auth";
import { getProductsForSeller } from "@/lib/services/seller-catalog";

// Auth and status gating (onboarding/rejected/suspended) live in
// app/seller/(dashboard)/layout.tsx -- by the time this renders, the seller
// is confirmed active.
export async function SellerDashboard() {
  const context = await getSellerAccessContext();
  if (!context) return null;
  const { seller } = context;

  const products = await getProductsForSeller(seller.id);
  const pendingCount = products.filter((p) => p.status === "pending_review").length;
  const liveCount = products.filter((p) => p.status === "live").length;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-black text-[#171717]">Overview</h1>
      <section className="grid gap-3 md:grid-cols-3">
        <div className={`${cardClass} p-4`}>
          <p className={microLabelClass}>Live products</p>
          <div className={`mt-2 ${statValueClass}`}>{liveCount}</div>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className={microLabelClass}>Pending review</p>
          <div className={`mt-2 ${statValueClass}`}>{pendingCount}</div>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className={microLabelClass}>Commission rate</p>
          <div className={`mt-2 ${statValueClass}`}>{seller.commissionPct}%</div>
        </div>
      </section>
    </div>
  );
}
