import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createInsuranceRule, updateInsuranceRule } from "@/lib/services/admin-catalog";
import { insuranceRuleSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = insuranceRuleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid insurance payload" }, { status: 400 });
  }

  try {
    return Response.json({ rule: await createInsuranceRule(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create insurance rule" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = insuranceRuleSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid insurance update" }, { status: 400 });
  }

  try {
    return Response.json({ rule: await updateInsuranceRule(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update insurance rule" }, { status: 500 });
  }
}
