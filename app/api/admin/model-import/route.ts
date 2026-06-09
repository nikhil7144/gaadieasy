import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createModelWithVariants } from "@/lib/services/admin-catalog";
import { modelImportSchema } from "@/lib/validations/admin";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unable to import model";
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = modelImportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid model import", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createModelWithVariants(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
