import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { approveRefundRequest, getRefundRequestsForAdmin, rejectRefundRequest } from "@/lib/services/gear-refunds";
import { refundModerationSchema } from "@/lib/validations/gaadigear-admin";

export async function GET(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  try {
    return Response.json({ refundRequests: await getRefundRequestsForAdmin(status) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load refund requests" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = refundModerationSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid request", issues: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "approve") {
      const { id, refundAmount, refundShipping } = parsed.data;
      return Response.json({ refundRequest: await approveRefundRequest(id, { refundAmount, refundShipping }, guard.user.id) });
    }
    return Response.json({ refundRequest: await rejectRefundRequest(parsed.data.id, parsed.data.adminNotes, guard.user.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update refund request" }, { status: 500 });
  }
}
