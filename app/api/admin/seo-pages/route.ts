import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { seoPageSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = seoPageSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid SEO page", issues: parsed.error.flatten() }, { status: 400 });
  return Response.json({ seoPage: { id: `seo-${Date.now()}`, ...parsed.data } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ seoPage: await request.json() });
}
