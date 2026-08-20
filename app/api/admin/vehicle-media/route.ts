import { revalidatePath } from "next/cache";
import { revalidateCatalog } from "@/lib/services/catalog-cache";
import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanPathPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return Response.json({ error: "Supabase service role is not configured." }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get("file");
    const modelId = String(formData.get("modelId") ?? "");
    const variantId = String(formData.get("variantId") ?? "");
    const colorName = String(formData.get("colorName") ?? "").trim();
    const mediaType = String(formData.get("mediaType") ?? "exterior");
    const alt = String(formData.get("alt") ?? "").trim();
    const displayOrder = Number(formData.get("displayOrder") ?? 0);

    if (!modelId || !variantId || !(file instanceof File)) {
      return Response.json({ error: "modelId, variantId and image file are required." }, { status: 400 });
    }

    const path = `${modelId}/${variantId}/${Date.now()}-${cleanPathPart(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("vehicle-media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from("vehicle-media").getPublicUrl(path);
    const { data, error } = await supabase
      .from("vehicle_media")
      .insert({
        model_id: modelId,
        variant_id: variantId,
        color_name: colorName || null,
        url: publicData.publicUrl,
        alt: alt || file.name,
        media_type: mediaType,
        display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
        active: true,
      })
      .select("*")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data: model } = await supabase
      .from("vehicle_models")
      .select("image_url")
      .eq("id", modelId)
      .maybeSingle();

    const currentImage = typeof model?.image_url === "string" ? model.image_url : "";
    if (!currentImage || currentImage.includes("example.com")) {
      await supabase.from("vehicle_models").update({ image_url: publicData.publicUrl }).eq("id", modelId);
    }

    revalidatePath("/");
    revalidatePath("/on-road-price");
    revalidatePath("/admin/variants");
    // vehicle_media is part of BrowseDataSet — clear the tagged catalog entries too.
    revalidateCatalog();

    return Response.json({ media: data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
