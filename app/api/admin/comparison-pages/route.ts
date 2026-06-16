import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createComparisonPageInDb, deleteComparisonPageFromDb, updateComparisonPageInDb } from "@/lib/services/comparisons/db";
import { comparisonPageSchema } from "@/lib/validations/admin";
import { z } from "zod";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const body = await request.json();
  const parsed = comparisonPageSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join(" | ");
    return Response.json({ error: `Invalid comparison page — ${fields}` }, { status: 400 });
  }

  try {
    return Response.json({ comparisonPage: await createComparisonPageInDb(parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create comparison page" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = comparisonPageSchema.partial().extend({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) {
    const fields = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join(" | ");
    return Response.json({ error: `Invalid comparison page — ${fields}` }, { status: 400 });
  }

  try {
    return Response.json({ comparisonPage: await updateComparisonPageInDb(parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update comparison page" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid id" }, { status: 400 });

  try {
    return Response.json({ deleted: await deleteComparisonPageFromDb(parsed.data.id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete comparison page" }, { status: 500 });
  }
}
