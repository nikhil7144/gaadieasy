import { z } from "zod";
import { getReviewsForModel, submitReview } from "@/lib/services/reviews";

const submitSchema = z.object({
  modelId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  userName: z.string().min(2).max(60),
  city: z.string().max(60).optional(),
  ownedFor: z.string().max(60).optional(),
  overallRating: z.coerce.number().int().min(1).max(5),
  engineRating: z.coerce.number().int().min(1).max(5).optional(),
  dealerRating: z.coerce.number().int().min(1).max(5).optional(),
  comfortRating: z.coerce.number().int().min(1).max(5).optional(),
  valueRating: z.coerce.number().int().min(1).max(5).optional(),
  pros: z.string().max(1000).optional(),
  cons: z.string().max(1000).optional(),
  body: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modelId = searchParams.get("modelId");

  if (!modelId) return Response.json({ error: "modelId required" }, { status: 400 });

  const reviews = await getReviewsForModel(modelId).catch(() => []);
  return Response.json({ reviews });
}

export async function POST(request: Request) {
  const parsed = submitSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid submission", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const review = await submitReview(parsed.data);
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to submit";
    const isTableMissing = msg.includes("does not exist") || msg.includes("42P01");
    if (isTableMissing) {
      return Response.json(
        { error: "Reviews are not yet available. The database table needs to be created." },
        { status: 503 },
      );
    }
    return Response.json({ error: "Unable to save review. Please try again." }, { status: 500 });
  }
}
