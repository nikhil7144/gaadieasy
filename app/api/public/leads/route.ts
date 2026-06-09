import { createVehicleLead } from "@/lib/services/leads";
import { publicLeadSchema } from "@/lib/validations/lead";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = publicLeadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid lead", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createVehicleLead(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create lead" },
      { status: 500 },
    );
  }
}
