import { getCartWithServiceability } from "@/lib/services/gear-checkout";
import { checkServiceabilitySchema } from "@/lib/validations/gear-buyer";

export async function POST(request: Request) {
  const parsed = checkServiceabilitySchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid address", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const { cart, groups } = await getCartWithServiceability(parsed.data);
    return Response.json({ cart, sellerGroups: groups });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to check serviceability" }, { status: 500 });
  }
}
