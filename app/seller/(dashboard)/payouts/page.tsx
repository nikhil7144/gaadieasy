import { microLabelClass } from "@/components/seller/dashboardStyles";
import { PayoutStatusBadge } from "@/components/seller/StatusBadge";
import { getPayoutsForSeller, getUpcomingForSeller } from "@/lib/services/gear-payouts";
import { getSellerAccessContext } from "@/lib/services/seller-auth";

export default async function SellerPayoutsPage() {
  const context = await getSellerAccessContext();
  if (!context) return null;

  const [payouts, upcoming] = await Promise.all([getPayoutsForSeller(context.seller.id), getUpcomingForSeller(context.seller.id)]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-black text-[#171717]">Payouts</h1>

      <section>
        <h2 className={`mb-2 ${microLabelClass}`}>Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Nothing pending right now.</p>
        ) : (
          <div className="divide-y divide-black/[0.08] rounded-lg border border-black/[0.08] bg-white">
            {upcoming.map((u) => (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm" key={u.id}>
                <span className="font-bold text-[#171717]">₹{u.itemsSubtotal + u.shippingFee}</span>
                <span className="text-xs text-[#6b7280]">{u.reason}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={`mb-2 ${microLabelClass}`}>Past payouts</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No payouts yet.</p>
        ) : (
          <div className="divide-y divide-black/[0.08] rounded-lg border border-black/[0.08] bg-white">
            {payouts.map((p) => (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm" key={p.id}>
                <span className="text-xs text-[#6b7280]">
                  {p.periodStart} → {p.periodEnd} · {p.totalShipments} shipment(s)
                </span>
                <span className="font-bold text-[#171717]">₹{p.netPayout.toFixed(2)}</span>
                <PayoutStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
