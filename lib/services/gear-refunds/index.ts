import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentBuyerId } from "@/lib/services/gear-cart";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

function str(row: DbRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function optionalStr(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === "string" && value ? value : undefined;
}

function num(row: DbRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback);
}

export type RefundRequestItemInput = { orderItemId: string; qty: number; refundAmount: number };

export type RefundRequest = {
  id: string;
  shipmentId: string;
  reasonCategory: string;
  reasonNote?: string;
  status: string;
  requestedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
  refundAmount?: number;
  refundShipping: boolean;
};

function mapRefundRequest(row: DbRow): RefundRequest {
  return {
    id: str(row, "id"),
    shipmentId: str(row, "shipment_id"),
    reasonCategory: str(row, "reason_category"),
    reasonNote: optionalStr(row, "reason_note"),
    status: str(row, "status", "requested"),
    requestedAt: str(row, "requested_at"),
    resolvedAt: optionalStr(row, "resolved_at"),
    adminNotes: optionalStr(row, "admin_notes"),
    refundAmount: row.refund_amount !== null && row.refund_amount !== undefined ? num(row, "refund_amount") : undefined,
    refundShipping: Boolean(row.refund_shipping),
  };
}

// No strict ownership enforcement -- matches the existing simplification for
// order confirmation pages (guest checkout has no buyer_id to check against).
// buyer_id is stored on the request when the requester happens to be logged in.
export async function createRefundRequest(
  shipmentId: string,
  input: { reasonCategory: string; reasonNote?: string; items: RefundRequestItemInput[] },
): Promise<RefundRequest> {
  const supabase = getAdminClient();
  const buyerId = await getCurrentBuyerId();

  const { data, error } = await supabase
    .from("gear_refund_requests")
    .insert({
      shipment_id: shipmentId,
      buyer_id: buyerId ?? null,
      reason_category: input.reasonCategory,
      reason_note: input.reasonNote ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const request = data as DbRow;

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from("gear_refund_request_items").insert(
      input.items.map((item) => ({
        refund_request_id: request.id,
        order_item_id: item.orderItemId,
        qty: item.qty,
        refund_amount: item.refundAmount,
      })),
    );
    if (itemsError) throw itemsError;
  }

  return mapRefundRequest(request);
}

export async function getRefundRequestForShipment(shipmentId: string): Promise<RefundRequest | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_refund_requests")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRefundRequest(data as DbRow) : null;
}

export async function getRefundRequestsForAdmin(status?: string): Promise<RefundRequest[]> {
  const supabase = getAdminClient();
  let query = supabase.from("gear_refund_requests").select("*").order("requested_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as DbRow[]).map(mapRefundRequest);
}

export async function rejectRefundRequest(id: string, adminNotes: string, resolvedBy: string): Promise<RefundRequest> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_refund_requests")
    .update({ status: "rejected", admin_notes: adminNotes, resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRefundRequest(data as DbRow);
}

// Stub refund -- mirrors confirmMockPayment. A real gateway integration would
// issue the refund and wait for a webhook before flipping to "refunded"; here
// it's simulated as always-successful and immediate.
export async function approveRefundRequest(
  id: string,
  input: { refundAmount: number; refundShipping: boolean },
  resolvedBy: string,
): Promise<RefundRequest> {
  const supabase = getAdminClient();

  const { data: requestRow, error: requestError } = await supabase.from("gear_refund_requests").select("*").eq("id", id).single();
  if (requestError) throw requestError;
  const shipmentId = str(requestRow as DbRow, "shipment_id");

  const { data: shipmentRow, error: shipmentError } = await supabase.from("gear_order_shipments").select("*").eq("id", shipmentId).single();
  if (shipmentError) throw shipmentError;
  const shipment = shipmentRow as DbRow;

  const oldItemsSubtotal = num(shipment, "items_subtotal");
  const oldShippingFee = num(shipment, "shipping_fee");
  const oldCommissionAmount = num(shipment, "commission_amount");

  const isFullRefund = input.refundAmount >= oldItemsSubtotal;

  const newItemsSubtotal = Math.max(0, oldItemsSubtotal - input.refundAmount);
  const newShippingFee = input.refundShipping ? 0 : oldShippingFee;
  // Scale commission proportionally to the remaining items subtotal -- a
  // reasonable approximation for this stubbed system, not full re-derivation
  // from each remaining line's GST.
  const newCommissionAmount = oldItemsSubtotal > 0 ? (oldCommissionAmount * newItemsSubtotal) / oldItemsSubtotal : 0;
  const newSellerPayoutAmount = newItemsSubtotal - newCommissionAmount + newShippingFee;

  const { error: shipmentUpdateError } = await supabase
    .from("gear_order_shipments")
    .update({
      items_subtotal: newItemsSubtotal,
      shipping_fee: newShippingFee,
      commission_amount: newCommissionAmount,
      seller_payout_amount: newSellerPayoutAmount,
      payout_status: isFullRefund ? "excluded" : shipment.payout_status,
    })
    .eq("id", shipmentId);
  if (shipmentUpdateError) throw shipmentUpdateError;

  const { data, error } = await supabase
    .from("gear_refund_requests")
    .update({
      status: "refunded",
      refund_amount: input.refundAmount,
      refund_shipping: input.refundShipping,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      gateway_refund_ref: `mock_${randomUUID()}`,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapRefundRequest(data as DbRow);
}
