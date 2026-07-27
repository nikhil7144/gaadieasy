import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCart, getCurrentBuyerId, groupCartBySeller } from "@/lib/services/gear-cart";
import type { GearCartSellerGroup, GearOrderSummary } from "@/types/automobile";

type DbRow = Record<string, unknown>;

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

export type ShippingAddress = {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
};

type SellerShippingSettings = {
  shipsPanIndia: boolean;
  excludedStates: string[];
  excludedPincodes: string[];
  feeType: "flat" | "free" | "threshold";
  flatFee: number;
  freeShippingAbove?: number;
  codAvailable: boolean;
};

async function getSellerShippingSettings(sellerId: string): Promise<SellerShippingSettings> {
  const supabase = getAdminClient();
  const { data } = await supabase.from("seller_shipping_settings").select("*").eq("seller_id", sellerId).maybeSingle();
  if (!data) {
    // No settings row yet -- default to PAN-India flat-free, so checkout
    // isn't blocked on a seller who hasn't configured shipping.
    return { shipsPanIndia: true, excludedStates: [], excludedPincodes: [], feeType: "free", flatFee: 0, codAvailable: false };
  }
  const row = data as DbRow;
  return {
    shipsPanIndia: Boolean(row.ships_pan_india ?? true),
    excludedStates: Array.isArray(row.excluded_states) ? (row.excluded_states as string[]) : [],
    excludedPincodes: Array.isArray(row.excluded_pincodes) ? (row.excluded_pincodes as string[]) : [],
    feeType: (row.fee_type as SellerShippingSettings["feeType"]) ?? "flat",
    flatFee: Number(row.flat_fee ?? 0),
    freeShippingAbove: row.free_shipping_above !== null && row.free_shipping_above !== undefined ? Number(row.free_shipping_above) : undefined,
    codAvailable: Boolean(row.cod_available ?? false),
  };
}

function computeShippingFee(settings: SellerShippingSettings, itemsSubtotal: number): number {
  if (settings.feeType === "free") return 0;
  if (settings.feeType === "threshold") {
    return settings.freeShippingAbove !== undefined && itemsSubtotal >= settings.freeShippingAbove ? 0 : settings.flatFee;
  }
  return settings.flatFee;
}

export type ServiceabilityResult = { sellerId: string; deliverable: boolean; note?: string };

export async function checkServiceability(sellerIds: string[], address: Pick<ShippingAddress, "pincode" | "state">): Promise<ServiceabilityResult[]> {
  const results: ServiceabilityResult[] = [];
  for (const sellerId of sellerIds) {
    const settings = await getSellerShippingSettings(sellerId);
    if (!settings.shipsPanIndia) {
      results.push({ sellerId, deliverable: false, note: "This seller doesn't currently ship to your area." });
      continue;
    }
    if (settings.excludedPincodes.includes(address.pincode)) {
      results.push({ sellerId, deliverable: false, note: "This seller doesn't deliver to this pincode." });
      continue;
    }
    if (settings.excludedStates.includes(address.state)) {
      results.push({ sellerId, deliverable: false, note: "This seller doesn't deliver to this state." });
      continue;
    }
    results.push({ sellerId, deliverable: true });
  }
  return results;
}

export async function getCartWithServiceability(address?: Pick<ShippingAddress, "pincode" | "state">) {
  const cart = await getCart();
  const groups = groupCartBySeller(cart);

  if (address) {
    const serviceability = await checkServiceability(
      groups.map((g) => g.sellerId),
      address,
    );
    for (const group of groups) {
      const result = serviceability.find((r) => r.sellerId === group.sellerId);
      group.deliverable = result?.deliverable ?? true;
      group.serviceabilityNote = result?.note;
      if (group.deliverable) {
        const settings = await getSellerShippingSettings(group.sellerId);
        group.shippingFee = computeShippingFee(settings, group.itemsSubtotal);
      }
    }
  }

  return { cart, groups };
}

function gstAmountForLine(unitPrice: number, qty: number, gstRate: number): number {
  return (unitPrice * qty * gstRate) / (100 + gstRate);
}

export async function createOrderFromCart(shippingAddress: ShippingAddress): Promise<GearOrderSummary> {
  const supabase = getAdminClient();
  const buyerId = await getCurrentBuyerId();
  const { cart, groups } = await getCartWithServiceability({ pincode: shippingAddress.pincode, state: shippingAddress.state });

  if (cart.items.length === 0) throw new Error("Your cart is empty.");

  const undeliverable = groups.filter((g) => !g.deliverable);
  if (undeliverable.length > 0) {
    throw new Error(`Some items can't be delivered to this address: ${undeliverable.map((g) => g.sellerName ?? g.sellerId).join(", ")}. Remove them or use a different address.`);
  }

  const shippingTotal = groups.reduce((sum, g) => sum + g.shippingFee, 0);
  const itemsSubtotal = groups.reduce((sum, g) => sum + g.itemsSubtotal, 0);
  const grandTotal = itemsSubtotal + shippingTotal;

  const { data: orderRow, error: orderError } = await supabase
    .from("gear_orders")
    .insert({
      buyer_id: buyerId ?? null,
      status: "placed",
      items_subtotal: itemsSubtotal,
      shipping_total: shippingTotal,
      grand_total: grandTotal,
      payment_status: "pending",
      shipping_address: shippingAddress,
    })
    .select("*")
    .single();

  if (orderError) throw orderError;
  const orderId = String((orderRow as DbRow).id);

  const shipments = await Promise.all(groups.map((group) => createShipmentForSellerGroup(orderId, group)));

  const supabaseCleanup = getAdminClient();
  const { error: clearCartError } = await supabaseCleanup.from("gear_cart_items").delete().eq("cart_id", cart.id);
  if (clearCartError) throw clearCartError;

  // No real gateway is wired up yet (see confirmMockPayment's own comment) --
  // until one is, auto-confirm here rather than leaving the order in
  // "pending" and exposing a "Simulate successful payment" control to real
  // buyers on the confirmation page. Swap this for a real gateway
  // redirect/webhook flow once a provider is chosen.
  await confirmMockPayment(orderId);

  return {
    id: orderId,
    buyerId,
    status: String((orderRow as DbRow).status),
    paymentStatus: "paid",
    itemsSubtotal,
    shippingTotal,
    grandTotal,
    createdAt: String((orderRow as DbRow).created_at),
    shipments,
  };
}

async function createShipmentForSellerGroup(orderId: string, group: GearCartSellerGroup) {
  const supabase = getAdminClient();
  const gstAmount = group.items.reduce((sum, item) => sum + gstAmountForLine(item.unitPrice, item.qty, item.gstRate), 0);

  const { data: seller } = await supabase.from("sellers").select("commission_pct").eq("id", group.sellerId).maybeSingle();
  const commissionPct = seller ? Number((seller as DbRow).commission_pct ?? 10) : 10;
  const commissionAmount = ((group.itemsSubtotal - gstAmount) * commissionPct) / 100;
  const sellerPayoutAmount = group.itemsSubtotal - commissionAmount + group.shippingFee;

  const { data: shipmentRow, error: shipmentError } = await supabase
    .from("gear_order_shipments")
    .insert({
      order_id: orderId,
      seller_id: group.sellerId,
      items_subtotal: group.itemsSubtotal,
      shipping_fee: group.shippingFee,
      gst_amount: gstAmount,
      commission_amount: commissionAmount,
      seller_payout_amount: sellerPayoutAmount,
      shipment_status: "placed",
    })
    .select("*")
    .single();

  if (shipmentError) throw shipmentError;
  const shipmentId = String((shipmentRow as DbRow).id);

  const itemRows = group.items.map((item) => ({
    shipment_id: shipmentId,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    qty: item.qty,
    unit_price: item.unitPrice,
    gst_rate: item.gstRate,
    gst_amount: gstAmountForLine(item.unitPrice, item.qty, item.gstRate),
  }));

  const { error: itemsError } = await supabase.from("gear_order_items").insert(itemRows);
  if (itemsError) throw itemsError;

  return {
    id: shipmentId,
    sellerId: group.sellerId,
    sellerName: group.sellerName,
    itemsSubtotal: group.itemsSubtotal,
    shippingFee: group.shippingFee,
    gstAmount,
    shipmentStatus: "placed",
    items: group.items,
  };
}

// Stub payment confirmation -- the seam where a real gateway (Razorpay/
// Cashfree/etc., decision deferred, see GAADIGEAR_PLAN.md) will eventually
// verify a webhook/callback signature before flipping payment_status. For
// now this simulates an always-successful payment so checkout, order
// confirmation, and downstream flows (refunds, payouts) can be built and
// tested without a live gateway.
export async function confirmMockPayment(orderId: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("gear_orders")
    .update({ payment_status: "paid", payment_gateway_ref: `mock_${randomUUID()}` })
    .eq("id", orderId);
  if (error) throw error;
}

export async function getOrderSummary(orderId: string): Promise<GearOrderSummary | null> {
  const supabase = getAdminClient();
  const { data: orderRow } = await supabase.from("gear_orders").select("*").eq("id", orderId).maybeSingle();
  if (!orderRow) return null;

  const { data: shipmentRows } = await supabase
    .from("gear_order_shipments")
    .select("*, sellers(business_name), gear_order_items(*, gear_products(title, slug, images))")
    .eq("order_id", orderId);

  const shipments = ((shipmentRows ?? []) as DbRow[]).map((s) => {
    const seller = s.sellers as DbRow | null;
    const items = Array.isArray(s.gear_order_items) ? (s.gear_order_items as DbRow[]) : [];
    return {
      id: String(s.id),
      sellerId: String(s.seller_id),
      sellerName: seller ? String(seller.business_name) : undefined,
      itemsSubtotal: Number(s.items_subtotal),
      shippingFee: Number(s.shipping_fee),
      gstAmount: Number(s.gst_amount),
      shipmentStatus: String(s.shipment_status),
      items: items.map((item) => {
        const product = item.gear_products as DbRow;
        const images = product && Array.isArray(product.images) ? (product.images as string[]) : [];
        return {
          id: String(item.id),
          productId: String(item.product_id),
          variantId: item.variant_id ? String(item.variant_id) : undefined,
          qty: Number(item.qty),
          title: product ? String(product.title) : "",
          slug: product ? String(product.slug) : "",
          sellerId: String(s.seller_id),
          sellerName: seller ? String(seller.business_name) : undefined,
          unitPrice: Number(item.unit_price),
          gstRate: Number(item.gst_rate),
          thumbnailUrl: images[0],
          lineTotal: Number(item.unit_price) * Number(item.qty),
        };
      }),
    };
  });

  const row = orderRow as DbRow;
  return {
    id: String(row.id),
    buyerId: typeof row.buyer_id === "string" ? row.buyer_id : undefined,
    status: String(row.status),
    paymentStatus: String(row.payment_status),
    itemsSubtotal: Number(row.items_subtotal),
    shippingTotal: Number(row.shipping_total),
    grandTotal: Number(row.grand_total),
    createdAt: String(row.created_at),
    shipments,
  };
}

// Order history for a logged-in buyer's account page. Guest orders (no
// buyer_id) aren't listed anywhere -- a guest's only access to their order is
// the confirmation link right after checkout, same trade-off as the rest of
// the guest-checkout flow.
export async function getOrdersForBuyer(buyerId: string): Promise<{ id: string; status: string; paymentStatus: string; grandTotal: number; createdAt: string }[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_orders")
    .select("id, status, payment_status, grand_total, created_at")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbRow[]).map((row) => ({
    id: String(row.id),
    status: String(row.status),
    paymentStatus: String(row.payment_status),
    grandTotal: Number(row.grand_total),
    createdAt: String(row.created_at),
  }));
}
