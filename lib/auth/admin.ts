import type { User } from "@supabase/supabase-js";

export function isPlatformAdmin(user: User | null) {
  return user?.app_metadata?.role === "platform_admin";
}
