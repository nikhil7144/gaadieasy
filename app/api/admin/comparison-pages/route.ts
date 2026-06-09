import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { comparisonPageSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = comparisonPageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid comparison page", issues: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json({ comparisonPage: { id: `comparison-${Date.now()}`, ...parsed.data } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = comparisonPageSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid comparison page update", issues: parsed.error.flatten() }, { status: 400 });
  }

  return Response.json({ comparisonPage: parsed.data });
}
