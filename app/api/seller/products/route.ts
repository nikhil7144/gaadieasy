import { requireSellerContext } from "@/lib/auth/require-seller";
import {
  createProductForSeller,
  deleteDraftProduct,
  getProductsForSeller,
  publishProduct,
  setProductPaused,
  updateProductForSeller,
} from "@/lib/services/seller-catalog";
import { sellerProductActionSchema, sellerProductCreateSchema } from "@/lib/validations/seller";
import { z } from "zod";

export async function GET() {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  try {
    return Response.json({ products: await getProductsForSeller(guard.context.seller.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerProductCreateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ product: await createProductForSeller(guard.context.seller.id, parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create product" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerProductActionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });

  const sellerId = guard.context.seller.id;

  try {
    if (parsed.data.action === "update") {
      const { action, id, ...rest } = parsed.data;
      void action;
      return Response.json({ product: await updateProductForSeller(sellerId, id, rest) });
    }
    if (parsed.data.action === "publish") {
      return Response.json({ product: await publishProduct(sellerId, parsed.data.id) });
    }
    if (parsed.data.action === "pause") {
      return Response.json({ product: await setProductPaused(sellerId, parsed.data.id, true) });
    }
    return Response.json({ product: await setProductPaused(sellerId, parsed.data.id, false) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid product", issues: parsed.error.flatten() }, { status: 400 });

  try {
    await deleteDraftProduct(guard.context.seller.id, parsed.data.id);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete product" }, { status: 500 });
  }
}
