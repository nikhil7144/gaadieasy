import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function num(row: DbRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

export type PayoutPreviewRow = { sellerId: string; sellerName?: string; shipmentCount: number; grossItems: number; grossShipping: number; commission: number; netPayout: number };

async function eligibleShipmentsGroupedBySeller(): Promise<Map<string, DbRow[]>> {
  const supabase = getAdminClient();
  // payout_eligible_shipments already checks: delivered, past the 3-day hold,
  // no unresolved refund request, not yet paid out. The extra payout_status
  // != 'excluded' guard covers shipments a full refund zeroed out after the
  // view's own refund check already resolved (see gear-refunds/index.ts).
  const { data, error } = await supabase.from("payout_eligible_shipments").select("*").neq("payout_status", "excluded");
  if (error) throw error;

  const bySeller = new Map<string, DbRow[]>();
  for (const row of (data ?? []) as DbRow[]) {
    const sellerId = String(row.seller_id);
    const list = bySeller.get(sellerId) ?? [];
    list.push(row);
    bySeller.set(sellerId, list);
  }
  return bySeller;
}

export async function getPayoutPreview(): Promise<PayoutPreviewRow[]> {
  const supabase = getAdminClient();
  const bySeller = await eligibleShipmentsGroupedBySeller();

  const rows: PayoutPreviewRow[] = [];
  for (const [sellerId, shipments] of bySeller) {
    const { data: seller } = await supabase.from("sellers").select("business_name").eq("id", sellerId).maybeSingle();
    rows.push({
      sellerId,
      sellerName: seller ? String((seller as DbRow).business_name) : undefined,
      shipmentCount: shipments.length,
      grossItems: shipments.reduce((sum, s) => sum + num(s, "items_subtotal"), 0),
      grossShipping: shipments.reduce((sum, s) => sum + num(s, "shipping_fee"), 0),
      commission: shipments.reduce((sum, s) => sum + num(s, "commission_amount"), 0),
      netPayout: shipments.reduce((sum, s) => sum + num(s, "items_subtotal") - num(s, "commission_amount") + num(s, "shipping_fee"), 0),
    });
  }
  return rows;
}

// Manual-trigger weekly payout run (see GAADIGEAR_PLAN.md -- no cron infra
// exists in this codebase; mirrors the catalog-rebuild/pricing-cache-backfill
// pattern of an admin-triggered button rather than a scheduled job).
export async function runPayoutBatch(): Promise<{ payoutsCreated: number; shipmentsPaid: number }> {
  const supabase = getAdminClient();
  const bySeller = await eligibleShipmentsGroupedBySeller();

  let payoutsCreated = 0;
  let shipmentsPaid = 0;
  const today = new Date();
  const periodStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const periodEnd = today.toISOString().slice(0, 10);

  for (const [sellerId, shipments] of bySeller) {
    const grossItems = shipments.reduce((sum, s) => sum + num(s, "items_subtotal"), 0);
    const grossShipping = shipments.reduce((sum, s) => sum + num(s, "shipping_fee"), 0);
    const commission = shipments.reduce((sum, s) => sum + num(s, "commission_amount"), 0);
    const netPayout = grossItems - commission + grossShipping;

    const { data: payoutRow, error: payoutError } = await supabase
      .from("seller_payouts")
      .insert({
        seller_id: sellerId,
        period_start: periodStart,
        period_end: periodEnd,
        total_shipments: shipments.length,
        gross_items_amount: grossItems,
        gross_shipping_amount: grossShipping,
        commission_amount: commission,
        net_payout: netPayout,
        // Stubbed -- no real payout mechanism (RazorpayX/Cashfree Payouts)
        // wired up yet, mirrors the mock-payment/mock-refund pattern.
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (payoutError) throw payoutError;
    payoutsCreated += 1;
    const payoutId = String((payoutRow as DbRow).id);

    const shipmentIds = shipments.map((s) => String(s.id));
    const { error: updateError } = await supabase
      .from("gear_order_shipments")
      .update({ payout_id: payoutId, payout_status: "paid" })
      .in("id", shipmentIds);
    if (updateError) throw updateError;
    shipmentsPaid += shipmentIds.length;
  }

  return { payoutsCreated, shipmentsPaid };
}

export type SellerPayout = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalShipments: number;
  grossItemsAmount: number;
  grossShippingAmount: number;
  commissionAmount: number;
  netPayout: number;
  status: string;
  paidAt?: string;
};

function mapSellerPayout(row: DbRow): SellerPayout {
  return {
    id: String(row.id),
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    totalShipments: num(row, "total_shipments"),
    grossItemsAmount: num(row, "gross_items_amount"),
    grossShippingAmount: num(row, "gross_shipping_amount"),
    commissionAmount: num(row, "commission_amount"),
    netPayout: num(row, "net_payout"),
    status: String(row.status ?? "pending"),
    paidAt: typeof row.paid_at === "string" ? row.paid_at : undefined,
  };
}

export async function getPayoutsForSeller(sellerId: string): Promise<SellerPayout[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("seller_payouts").select("*").eq("seller_id", sellerId).order("period_end", { ascending: false });
  if (error) throw error;
  return (data as DbRow[]).map(mapSellerPayout);
}

export type UpcomingShipment = { id: string; itemsSubtotal: number; shippingFee: number; reason: string };

export async function getUpcomingForSeller(sellerId: string): Promise<UpcomingShipment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_order_shipments")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("shipment_status", "delivered")
    .is("payout_id", null);

  if (error) throw error;

  const rows = (data ?? []) as DbRow[];
  const shipmentIds = rows.map((r) => String(r.id));
  const { data: refundRows } = shipmentIds.length
    ? await supabase.from("gear_refund_requests").select("shipment_id, status").in("shipment_id", shipmentIds).in("status", ["requested", "approved"])
    : { data: [] };
  const heldByRefund = new Set(((refundRows ?? []) as DbRow[]).map((r) => String(r.shipment_id)));

  const now = new Date();
  return rows.map((row) => {
    const holdUntil = row.payout_hold_until ? new Date(String(row.payout_hold_until)) : undefined;
    let reason = "Queued for next payout run";
    if (heldByRefund.has(String(row.id))) reason = "Refund pending admin review";
    else if (holdUntil && holdUntil > now) reason = `In 3-day return window (until ${holdUntil.toLocaleDateString()})`;

    return {
      id: String(row.id),
      itemsSubtotal: num(row, "items_subtotal"),
      shippingFee: num(row, "shipping_fee"),
      reason,
    };
  });
}
