import type { GearCart, GearCartSellerGroup } from "@/types/automobile";

// Pure grouping logic, safe to import from client components. The full cart
// service (lib/services/gear-cart) pulls in next/headers for the cart_token
// cookie and can't be bundled client-side, so this is split out separately.
export function groupCartBySellerClient(cart: GearCart): GearCartSellerGroup[] {
  const groups = new Map<string, GearCartSellerGroup>();
  for (const item of cart.items) {
    const group = groups.get(item.sellerId) ?? {
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      items: [],
      itemsSubtotal: 0,
      shippingFee: 0,
      deliverable: true,
    };
    group.items.push(item);
    group.itemsSubtotal += item.lineTotal;
    groups.set(item.sellerId, group);
  }
  return Array.from(groups.values());
}
