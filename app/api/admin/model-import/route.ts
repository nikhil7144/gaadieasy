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
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") || "root";
    const message = first ? `${path}: ${first.message}` : "Invalid model import payload";
    return Response.json({ error: message, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }

  try {
    const result = await createModelWithVariants(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
