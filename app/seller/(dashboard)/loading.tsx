import { cardClass } from "@/components/seller/dashboardStyles";

// Every page under this layout re-resolves getSellerAccessContext() plus its
// own data (products/orders/payouts/settings), so a tab click always costs a
// real round trip -- without this, there was zero visual feedback between
// clicking a sidebar link and the new page appearing, which read as the
// dashboard being unresponsive.
export default function SellerDashboardLoading() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
      <div className="h-6 w-40 rounded bg-black/[0.08]" />
      <div className={`${cardClass} h-24 p-4`}>
        <div className="h-4 w-1/3 rounded bg-black/[0.06]" />
        <div className="mt-3 h-8 w-1/4 rounded bg-black/[0.06]" />
      </div>
      <div className={`${cardClass} p-4`}>
        <div className="space-y-3">
          <div className="h-10 rounded bg-black/[0.05]" />
          <div className="h-10 rounded bg-black/[0.05]" />
          <div className="h-10 rounded bg-black/[0.05]" />
        </div>
      </div>
    </div>
  );
}
