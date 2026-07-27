import { requireSellerContext } from "@/lib/auth/require-seller";
import { createProductVariant, deleteProductVariant, getVariantsForProduct, updateProductVariant } from "@/lib/services/seller-catalog";
import { sellerProductVariantActionSchema } from "@/lib/validations/seller";

export async function GET(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return Response.json({ error: "productId is required" }, { status: 400 });

  try {
    return Response.json({ variants: await getVariantsForProduct(guard.context.seller.id, productId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerProductVariantActionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });

  const sellerId = guard.context.seller.id;

  try {
    if (parsed.data.action === "create") {
      const { action, productId, ...rest } = parsed.data;
      void action;
      return Response.json({ variant: await createProductVariant(sellerId, productId, rest) }, { status: 201 });
    }
    if (parsed.data.action === "update") {
      const { action, variantId, ...rest } = parsed.data;
      void action;
      return Response.json({ variant: await updateProductVariant(sellerId, variantId, rest) });
    }
    await deleteProductVariant(sellerId, parsed.data.variantId);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save variant" }, { status: 500 });
  }
}
