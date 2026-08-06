import { createPendingDealerSignup, getPendingDealerSignup, updatePendingDealerSignupEmail } from "@/lib/services/dealer-auth";
import { dealerSignupChangeEmailSchema, dealerSignupStartSchema } from "@/lib/validations/dealer";

export async function GET(request: Request) {
  const pendingId = new URL(request.url).searchParams.get("pendingId");
  if (!pendingId) return Response.json({ error: "pendingId is required" }, { status: 400 });

  try {
    const pending = await getPendingDealerSignup(pendingId);
    if (!pending) return Response.json({ error: "Signup request not found" }, { status: 404 });
    return Response.json(pending);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load signup request" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = dealerSignupStartSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Business name and a valid email are required" }, { status: 400 });

  try {
    const origin = new URL(request.url).origin;
    const pending = await createPendingDealerSignup(parsed.data.businessName, parsed.data.email, parsed.data.phone, origin);
    return Response.json(pending, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start signup" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const parsed = dealerSignupChangeEmailSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "A valid email is required" }, { status: 400 });

  try {
    const origin = new URL(request.url).origin;
    const pending = await updatePendingDealerSignupEmail(parsed.data.pendingId, parsed.data.email, origin);
    return Response.json(pending);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to change email" }, { status: 400 });
  }
}
