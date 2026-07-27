import { addCartItem, getCart, removeCartItem, updateCartItemQty } from "@/lib/services/gear-cart";
import { addCartItemSchema, removeCartItemSchema, updateCartItemSchema } from "@/lib/validations/gear-buyer";

export async function POST(request: Request) {
  const parsed = addCartItemSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid item", issues: parsed.error.flatten() }, { status: 400 });

  try {
    await addCartItem(parsed.data.productId, parsed.data.variantId, parsed.data.qty);
    return Response.json({ cart: await getCart() }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to add item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const parsed = updateCartItemSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid item", issues: parsed.error.flatten() }, { status: 400 });

  try {
    await updateCartItemQty(parsed.data.itemId, parsed.data.qty);
    return Response.json({ cart: await getCart() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const parsed = removeCartItemSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid item", issues: parsed.error.flatten() }, { status: 400 });

  try {
    await removeCartItem(parsed.data.itemId);
    return Response.json({ cart: await getCart() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to remove item" }, { status: 500 });
  }
}
