import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSellerForAuthenticatedUser } from "@/lib/services/seller-auth";
import { z } from "zod";

const schema = z.object({ businessName: z.string().min(2) });

// Called once, right after a first-time Google OAuth sign-in, from
// /gaadigear/sell/auth/complete -- signInWithOAuth only creates the
// auth.users session, this creates the linked sellers/seller_users rows.
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase auth is not configured" }, { status: 500 });

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) return Response.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Business name is required", issues: parsed.error.flatten() }, { status: 400 });

  try {
    const seller = await createSellerForAuthenticatedUser(data.user.id, parsed.data.businessName, data.user.email);
    return Response.json({ seller });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to complete signup" }, { status: 500 });
  }
}
