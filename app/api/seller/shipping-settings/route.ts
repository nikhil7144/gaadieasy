import { requireSellerContext } from "@/lib/auth/require-seller";
import { getSellerShippingSettings, upsertSellerShippingSettings } from "@/lib/services/seller-auth";
import { sellerShippingSettingsSchema } from "@/lib/validations/seller";

export async function GET() {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  try {
    return Response.json({ shippingSettings: await getSellerShippingSettings(guard.context.seller.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load shipping settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerShippingSettingsSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid shipping settings", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ shippingSettings: await upsertSellerShippingSettings(guard.context.seller.id, parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save shipping settings" }, { status: 500 });
  }
}
