import { vehicleMedia } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { VehicleMedia } from "@/types/automobile";

export function getVehicleMedia(modelId: string, variantId?: string) {
  const modelMedia = vehicleMedia
    .filter((item) => item.active && item.modelId === modelId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (!variantId) {
    return modelMedia;
  }

  const variantMedia = modelMedia.filter((item) => !item.variantId || item.variantId === variantId);

  return variantMedia.length ? variantMedia : modelMedia;
}

export function getVehicleColorMedia(modelId: string, variantId: string, colorName: string) {
  return getVehicleMedia(modelId, variantId).filter((item) => item.colorName === colorName);
}

export async function getVehicleMediaForApi(modelId: string, variantId?: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return getVehicleMedia(modelId, variantId);

  const { data } = await supabase
    .from("vehicle_media")
    .select("id, model_id, variant_id, color_name, url, alt, media_type, display_order, active")
    .eq("model_id", modelId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!data?.length) return getVehicleMedia(modelId, variantId);

  type R = Record<string, unknown>;
  const modelMedia: VehicleMedia[] = data.map((r) => ({
    id: String((r as R).id ?? ""),
    modelId: String((r as R).model_id ?? ""),
    variantId: (r as R).variant_id != null ? String((r as R).variant_id) : undefined,
    colorName: (r as R).color_name != null ? String((r as R).color_name) : undefined,
    url: String((r as R).url ?? ""),
    alt: String((r as R).alt ?? ""),
    mediaType: (String((r as R).media_type || "exterior")) as VehicleMedia["mediaType"],
    displayOrder: Number((r as R).display_order ?? 0),
    active: true,
  }));

  if (!variantId) return modelMedia;
  const variantMedia = modelMedia.filter((item) => !item.variantId || item.variantId === variantId);
  return variantMedia.length ? variantMedia : modelMedia;
}
