import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanPathPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") ?? "vehicle-story-media");
    const prefix = String(formData.get("prefix") ?? "uploads");

    if (!(file instanceof File)) return Response.json({ error: "File is required." }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    if (!supabase) return Response.json({ error: "Storage not configured." }, { status: 500 });

    const path = `${cleanPathPart(prefix)}/${Date.now()}-${cleanPathPart(file.name)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return Response.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
