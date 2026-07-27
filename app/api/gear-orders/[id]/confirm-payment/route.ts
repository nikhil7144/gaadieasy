import { confirmMockPayment, getOrderSummary } from "@/lib/services/gear-checkout";

// Stub confirmation endpoint -- stands in for a real payment gateway's
// success webhook/redirect callback until a gateway is chosen (see
// GAADIGEAR_PLAN.md). Always "succeeds"; real integration will verify a
// signature here instead of unconditionally marking the order paid.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await confirmMockPayment(id);
    return Response.json({ order: await getOrderSummary(id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to confirm payment" }, { status: 500 });
  }
}
