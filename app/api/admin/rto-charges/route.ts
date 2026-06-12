import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createRtoCharge, updateRtoCharge } from "@/lib/services/admin-catalog";
import { rtoChargeSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = rtoChargeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid RTO payload" }, { status: 400 });
  }

  try {
    return Response.json({ rtoCharge: await createRtoCharge(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create RTO charge" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = rtoChargeSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid RTO charge update" }, { status: 400 });
  }

  try {
    return Response.json({ rtoCharge: await updateRtoCharge(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update RTO charge" }, { status: 500 });
  }
}
