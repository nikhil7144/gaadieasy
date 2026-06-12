import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createTaxRule, updateTaxRule } from "@/lib/services/admin-catalog";
import { taxRuleSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = taxRuleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid tax rule payload" }, { status: 400 });
  }

  try {
    return Response.json({ taxRule: await createTaxRule(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create tax rule" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = taxRuleSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid tax rule update" }, { status: 400 });
  }

  try {
    return Response.json({ taxRule: await updateTaxRule(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update tax rule" }, { status: 500 });
  }
}
