import { getPublicVehicleTypes } from "@/lib/services/gear-public";

export async function GET() {
  return Response.json({ vehicleTypes: await getPublicVehicleTypes() });
}
