import { z } from "zod";
import { getExperiences, submitExperience } from "@/lib/services/experiences";

const submitSchema = z.object({
  dealerName: z.string().min(3).max(100),
  dealerCity: z.string().min(2).max(60),
  dealerBrand: z.string().max(60).optional(),
  modelId: z.string().uuid().optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleVariant: z.string().max(100).optional(),
  purchaseYear: z.coerce.number().int().min(2000).max(2035).optional(),
  visitType: z.enum(["purchase", "service", "test_ride", "enquiry", "other"]).optional(),
  reviewerName: z.string().min(2).max(60),
  reviewerEmail: z.string().email().optional(),
  overallRating: z.coerce.number().int().min(1).max(5),
  salesRating: z.coerce.number().int().min(1).max(5).optional(),
  serviceRating: z.coerce.number().int().min(1).max(5).optional(),
  waitTimeRating: z.coerce.number().int().min(1).max(5).optional(),
  priceTransparencyRating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().max(150).optional(),
  pros: z.string().max(1000).optional(),
  cons: z.string().max(1000).optional(),
  body: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const experiences = await getExperiences({
    q: searchParams.get("q") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    limit: Math.min(Number(searchParams.get("limit") ?? 24), 50),
  }).catch(() => []);
  return Response.json({ experiences });
}

export async function POST(request: Request) {
  const parsed = submitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid submission", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const experience = await submitExperience(parsed.data);
    return Response.json({ experience, dealerSlug: experience.dealerSlug }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to submit";
    console.error("[experiences POST]", msg);
    const isTableMissing = msg.includes("does not exist") || msg.includes("42P01") || msg.includes("schema cache");
    if (isTableMissing) {
      return Response.json(
        { error: "Experiences are not yet available. The database table needs to be created." },
        { status: 503 },
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
