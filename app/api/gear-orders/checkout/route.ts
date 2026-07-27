import { createOrderFromCart } from "@/lib/services/gear-checkout";
import { shippingAddressSchema } from "@/lib/validations/gear-buyer";

export async function POST(request: Request) {
  const parsed = shippingAddressSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid shipping address", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const order = await createOrderFromCart(parsed.data);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to place order" }, { status: 500 });
  }
}
