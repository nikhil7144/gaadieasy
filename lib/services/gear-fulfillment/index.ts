import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export type SellerShipment = {
  id: string;
  orderId: string;
  itemsSubtotal: number;
  shippingFee: number;
  shipmentStatus: string;
  payoutStatus: string;
  courierName?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  payoutHoldUntil?: string;
  createdAt: string;
  items: { title: string; qty: number; unitPrice: number }[];
};

function mapShipment(row: DbRow): SellerShipment {
  const items = Array.isArray(row.gear_order_items) ? (row.gear_order_items as DbRow[]) : [];
  return {
    id: str(row, "id"),
    orderId: str(row, "order_id"),
    itemsSubtotal: num(row, "items_subtotal"),
    shippingFee: num(row, "shipping_fee"),
    shipmentStatus: str(row, "shipment_status", "placed"),
    payoutStatus: str(row, "payout_status", "not_delivered"),
    courierName: optionalStr(row, "courier_name"),
    trackingNumber: optionalStr(row, "tracking_number"),
    shippedAt: optionalStr(row, "shipped_at"),
    deliveredAt: optionalStr(row, "delivered_at"),
    payoutHoldUntil: optionalStr(row, "payout_hold_until"),
    createdAt: str(row, "created_at"),
    items: items.map((item) => {
      const product = item.gear_products as DbRow | null;
      return { title: product ? str(product, "title") : "", qty: num(item, "qty"), unitPrice: num(item, "unit_price") };
    }),
  };
}

const SHIPMENT_SELECT = "*, gear_order_items(*, gear_products(title))";

export async function getShipmentsForSeller(sellerId: string): Promise<SellerShipment[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_order_shipments")
    .select(SHIPMENT_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbRow[]).map(mapShipment);
}

async function getOwnedShipment(sellerId: string, shipmentId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("gear_order_shipments").select("*").eq("id", shipmentId).eq("seller_id", sellerId).maybeSingle();
  if (error) throw error;
  return data as DbRow | null;
}

export async function markShipmentShipped(sellerId: string, shipmentId: string, courierName: string, trackingNumber: string): Promise<SellerShipment> {
  const existing = await getOwnedShipment(sellerId, shipmentId);
  if (!existing) throw new Error("Shipment not found for this seller");
  if (existing.shipment_status !== "placed" && existing.shipment_status !== "packed") {
    throw new Error(`Cannot mark a shipment "shipped" from status "${existing.shipment_status}"`);
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_order_shipments")
    .update({ shipment_status: "shipped", courier_name: courierName, tracking_number: trackingNumber, shipped_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .select(SHIPMENT_SELECT)
    .single();

  if (error) throw error;
  return mapShipment(data as DbRow);
}

export async function markShipmentDelivered(sellerId: string, shipmentId: string): Promise<SellerShipment> {
  const existing = await getOwnedShipment(sellerId, shipmentId);
  if (!existing) throw new Error("Shipment not found for this seller");
  if (existing.shipment_status === "delivered") throw new Error("Shipment is already marked delivered");
  if (existing.shipment_status === "cancelled" || existing.shipment_status === "returned") {
    throw new Error(`Cannot mark a ${existing.shipment_status} shipment as delivered`);
  }

  const deliveredAt = new Date();
  const payoutHoldUntil = new Date(deliveredAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_order_shipments")
    .update({
      shipment_status: "delivered",
      delivered_at: deliveredAt.toISOString(),
      payout_hold_until: payoutHoldUntil.toISOString(),
      payout_status: "holding",
    })
    .eq("id", shipmentId)
    .select(SHIPMENT_SELECT)
    .single();

  if (error) throw error;
  return mapShipment(data as DbRow);
}
