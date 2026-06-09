import { vehicleMedia } from "@/lib/data";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

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
  const data = await getVehicleDataSet();
  const modelMedia = data.media
    .filter((item) => item.active && item.modelId === modelId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (!variantId) {
    return modelMedia;
  }

  const variantMedia = modelMedia.filter((item) => !item.variantId || item.variantId === variantId);
  return variantMedia.length ? variantMedia : modelMedia;
}
