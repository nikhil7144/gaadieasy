import { z } from "zod";
import { resendSellerVerificationEmail } from "@/lib/services/seller-auth";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "A valid email is required" }, { status: 400 });

  try {
    const origin = new URL(request.url).origin;
    await resendSellerVerificationEmail(parsed.data.email, origin);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to resend verification email" }, { status: 500 });
  }
}
