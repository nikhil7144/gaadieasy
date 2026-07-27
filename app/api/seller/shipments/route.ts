import { requireSellerContext } from "@/lib/auth/require-seller";
import { getShipmentsForSeller, markShipmentDelivered, markShipmentShipped } from "@/lib/services/gear-fulfillment";
import { sellerShipmentActionSchema } from "@/lib/validations/seller";

export async function GET() {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  try {
    return Response.json({ shipments: await getShipmentsForSeller(guard.context.seller.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load shipments" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerShipmentActionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });

  const sellerId = guard.context.seller.id;

  try {
    if (parsed.data.action === "ship") {
      return Response.json({
        shipment: await markShipmentShipped(sellerId, parsed.data.shipmentId, parsed.data.courierName, parsed.data.trackingNumber),
      });
    }
    return Response.json({ shipment: await markShipmentDelivered(sellerId, parsed.data.shipmentId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update shipment" }, { status: 500 });
  }
}
