import { createRefundRequest, getRefundRequestForShipment } from "@/lib/services/gear-refunds";
import { createRefundRequestSchema } from "@/lib/validations/gear-buyer";

// Route param is named "id" (not "shipmentId") only because Next.js requires
// the same dynamic segment name across sibling routes under app/api/gear-orders/[id]/*
// -- the value passed here is still a shipment id, matching the spec's
// POST /api/gear-orders/:shipment_id/refund-request.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: shipmentId } = await params;
  return Response.json({ refundRequest: await getRefundRequestForShipment(shipmentId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: shipmentId } = await params;
  const parsed = createRefundRequestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid refund request", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ refundRequest: await createRefundRequest(shipmentId, parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to submit refund request" }, { status: 500 });
  }
}
