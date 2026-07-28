import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GearCart, GearCartItem } from "@/types/automobile";

type DbRow = Record<string, unknown>;

const CART_COOKIE = "gaadigear_cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getAdminClient() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role is not configured.");
  return supabase;
}

// Buyers are optional-account (see GAADIGEAR_PLAN.md) -- this returns
// undefined for guests rather than throwing, since being logged out is a
// normal, expected state here, not an error.
export async function getCurrentBuyerId(): Promise<string | undefined> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return undefined;
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

// Read-only lookup -- never writes a cookie or creates a cart row, so it's
// safe to call from a plain page render (Server Components can't set cookies;
// only Server Actions/Route Handlers can -- getOrCreateCartId below is only
// ever called from those). Returns undefined for "no cart yet", which is the
// normal state for a first-time visitor, not an error.
async function getExistingCartId(): Promise<string | undefined> {
  const supabase = getAdminClient();
  const buyerId = await getCurrentBuyerId();

  if (buyerId) {
    const { data: existing } = await supabase.from("gear_carts").select("id").eq("buyer_id", buyerId).maybeSingle();
    return existing ? String((existing as DbRow).id) : undefined;
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CART_COOKIE)?.value;
  if (!existingToken) return undefined;

  const { data: existing } = await supabase.from("gear_carts").select("id").eq("cart_token", existingToken).maybeSingle();
  return existing ? String((existing as DbRow).id) : undefined;
}

// Resolves (creating if needed) the current cart: by buyer_id if logged in,
// otherwise by a cart_token cookie so guest carts persist across requests.
// Writes a cookie for new guests, so this may only be called from a Server
// Action or Route Handler, never a plain page render (see getExistingCartId).
export async function getOrCreateCartId(): Promise<string> {
  const supabase = getAdminClient();
  const buyerId = await getCurrentBuyerId();
  const cookieStore = await cookies();

  if (buyerId) {
    const { data: existing } = await supabase.from("gear_carts").select("id").eq("buyer_id", buyerId).maybeSingle();
    if (existing) return String((existing as DbRow).id);

    const { data: created, error } = await supabase.from("gear_carts").insert({ buyer_id: buyerId }).select("id").single();
    if (error) throw error;
    return String((created as DbRow).id);
  }

  const existingToken = cookieStore.get(CART_COOKIE)?.value;
  if (existingToken) {
    const { data: existing } = await supabase.from("gear_carts").select("id").eq("cart_token", existingToken).maybeSingle();
    if (existing) return String((existing as DbRow).id);
  }

  const token = randomUUID();
  const { data: created, error } = await supabase.from("gear_carts").insert({ cart_token: token }).select("id").single();
  if (error) throw error;

  cookieStore.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });

  return String((created as DbRow).id);
}

// Low-level primitive, reused by both addCartItem and the merge-on-login
// logic. Manual check-then-upsert instead of relying on the unique
// constraint, since Postgres treats NULL != NULL -- an .upsert() keyed on
// (cart_id, product_id, variant_id) would insert a duplicate row every time
// variant_id is null instead of incrementing the existing one.
async function addCartItemToCart(cartId: string, productId: string, variantId: string | undefined, qty: number) {
  const supabase = getAdminClient();
  let query = supabase.from("gear_cart_items").select("*").eq("cart_id", cartId).eq("product_id", productId);
  query = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("gear_cart_items")
      .update({ qty: Number((existing as DbRow).qty) + qty })
      .eq("id", (existing as DbRow).id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("gear_cart_items").insert({ cart_id: cartId, product_id: productId, variant_id: variantId ?? null, qty });
  if (error) throw error;
}

export async function addCartItem(productId: string, variantId: string | undefined, qty: number): Promise<void> {
  const cartId = await getOrCreateCartId();
  await addCartItemToCart(cartId, productId, variantId, qty);
}

export async function updateCartItemQty(cartItemId: string, qty: number): Promise<void> {
  const supabase = getAdminClient();
  if (qty <= 0) {
    const { error } = await supabase.from("gear_cart_items").delete().eq("id", cartItemId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("gear_cart_items").update({ qty }).eq("id", cartItemId);
  if (error) throw error;
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.from("gear_cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

// Called from the login/signup flow: a guest's cart_token cookie (if any)
// gets folded into the buyer's account -- either by attaching buyer_id
// directly (buyer had no cart yet) or by merging quantities into an existing
// buyer cart and discarding the guest cart.
export async function mergeGuestCartOnLogin(buyerId: string): Promise<void> {
  const supabase = getAdminClient();
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return;

  const { data: guestCart } = await supabase.from("gear_carts").select("id").eq("cart_token", token).maybeSingle();
  if (!guestCart) {
    cookieStore.delete(CART_COOKIE);
    return;
  }
  const guestCartId = String((guestCart as DbRow).id);

  const { data: buyerCart } = await supabase.from("gear_carts").select("id").eq("buyer_id", buyerId).maybeSingle();

  if (!buyerCart) {
    const { error } = await supabase.from("gear_carts").update({ buyer_id: buyerId }).eq("id", guestCartId);
    if (error) throw error;
    cookieStore.delete(CART_COOKIE);
    return;
  }

  const buyerCartId = String((buyerCart as DbRow).id);
  if (buyerCartId === guestCartId) {
    cookieStore.delete(CART_COOKIE);
    return;
  }

  const { data: guestItems } = await supabase.from("gear_cart_items").select("*").eq("cart_id", guestCartId);
  for (const item of (guestItems ?? []) as DbRow[]) {
    await addCartItemToCart(
      buyerCartId,
      String(item.product_id),
      item.variant_id ? String(item.variant_id) : undefined,
      Number(item.qty),
    );
  }

  const { error } = await supabase.from("gear_carts").delete().eq("id", guestCartId);
  if (error) throw error;
  cookieStore.delete(CART_COOKIE);
}

// Safe to call from a plain page render -- read-only, never creates a cart or
// writes a cookie. A first-time visitor with no cart yet just gets an empty
// cart back, which is the correct display state, not an error.
export async function getCart(): Promise<GearCart> {
  const cartId = await getExistingCartId();
  if (!cartId) return { id: "", items: [], itemsSubtotal: 0 };

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("gear_cart_items")
    .select(
      "*, gear_products(title, slug, seller_id, category_id, gst_rate, images, sellers(business_name)), gear_product_variants(size, color, selling_price)",
    )
    .eq("cart_id", cartId);

  if (error) throw error;

  const items: GearCartItem[] = ((data ?? []) as DbRow[]).map((row) => {
    const product = row.gear_products as DbRow;
    const variant = row.gear_product_variants as DbRow | null;
    const seller = product.sellers as DbRow | null;
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    // Every product has >= 1 variant, and price lives there exclusively --
    // a cart item should always resolve a real variant.
    const unitPrice = variant ? Number(variant.selling_price) : 0;
    const qty = Number(row.qty);

    return {
      id: String(row.id),
      productId: String(row.product_id),
      variantId: row.variant_id ? String(row.variant_id) : undefined,
      categoryId: product.category_id ? String(product.category_id) : undefined,
      qty,
      title: String(product.title),
      slug: String(product.slug),
      sellerId: String(product.seller_id),
      sellerName: seller ? String(seller.business_name) : undefined,
      unitPrice,
      gstRate: Number(product.gst_rate),
      thumbnailUrl: images[0],
      variantLabel: variant ? [variant.size, variant.color].filter(Boolean).join(" / ") || undefined : undefined,
      lineTotal: unitPrice * qty,
    };
  });

  return {
    id: cartId,
    items,
    itemsSubtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

export { groupCartBySellerClient as groupCartBySeller } from "@/lib/utils/gear-cart-client";
