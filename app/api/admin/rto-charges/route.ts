import { requirePlatformAdmin } from "@/lib/auth/require-admin";

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ rtoCharge: { id: `rto-charge-${Date.now()}`, ...(await request.json()) } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ rtoCharge: await request.json() });
}
