import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createHomepageBanner, updateHomepageBanner } from "@/lib/services/admin-catalog";
import { homepageBannerSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = homepageBannerSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid homepage banner", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ banner: await createHomepageBanner(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create homepage banner" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = homepageBannerSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid homepage banner", issues: parsed.error.flatten() }, { status: 400 });

  try {
    return Response.json({ banner: await updateHomepageBanner(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update homepage banner" }, { status: 500 });
  }
}
