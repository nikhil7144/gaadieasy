import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { getSessionJourney } from "@/lib/services/analytics";

export async function GET(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const sessionId = new URL(request.url).searchParams.get("id");
  if (!sessionId) return Response.json({ error: "Missing session id" }, { status: 400 });

  try {
    return Response.json({ pageviews: await getSessionJourney(sessionId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load session" }, { status: 500 });
  }
}
