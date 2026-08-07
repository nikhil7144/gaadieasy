import { logPageview } from "@/lib/services/analytics";
import { pageviewSchema } from "@/lib/validations/analytics";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = pageviewSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid pageview" }, { status: 400 });

  try {
    await logPageview(parsed.data);
  } catch {
    // Analytics must never surface as a broken page to a real visitor.
  }
  return Response.json({ ok: true });
}
