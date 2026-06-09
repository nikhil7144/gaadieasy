import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { getAdminLeads } from "@/lib/services/leads";

export async function GET() {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ leads: await getAdminLeads() });
}
