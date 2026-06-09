import { isPlatformAdmin } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePlatformAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      user: null,
      response: Response.json({ error: "Supabase auth is not configured" }, { status: 500 }),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      user: null,
      response: Response.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  if (!isPlatformAdmin(data.user)) {
    return {
      user: data.user,
      response: Response.json({ error: "Platform admin role required" }, { status: 403 }),
    };
  }

  return { user: data.user, response: null };
}
