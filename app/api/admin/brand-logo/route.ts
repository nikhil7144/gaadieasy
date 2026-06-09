import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanPathPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return Response.json({ error: "Supabase service role is not configured." }, { status: 500 });

  const formData = await request.formData();
  const file = formData.get("file");
  const brandSlug = cleanPathPart(String(formData.get("brandSlug") ?? "brand"));

  if (!(file instanceof File)) {
    return Response.json({ error: "Logo file is required." }, { status: 400 });
  }

  const path = `${brandSlug}/${Date.now()}-${cleanPathPart(file.name)}`;
  const { error } = await supabase.storage.from("brand-logos").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);

  return Response.json({ url: data.publicUrl }, { status: 201 });
}
