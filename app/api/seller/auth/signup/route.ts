import { signUpSeller } from "@/lib/services/seller-auth";
import { sellerCompleteSignupSchema } from "@/lib/validations/seller";

export async function POST(request: Request) {
  const parsed = sellerCompleteSignupSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid signup details", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ seller: await signUpSeller(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create seller account" }, { status: 500 });
  }
}
