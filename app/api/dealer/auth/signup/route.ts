import { signUpDealerBusiness } from "@/lib/services/dealer-auth";
import { dealerCompleteSignupSchema } from "@/lib/validations/dealer";

export async function POST(request: Request) {
  const parsed = dealerCompleteSignupSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid signup details", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ business: await signUpDealerBusiness(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create dealer account" }, { status: 500 });
  }
}
