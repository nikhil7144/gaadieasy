import { createDealerOffer, getDealerOffersForContext } from "@/lib/services/dealer-offers";
import { getDealerAccessContext } from "@/lib/services/dealer-auth";

export async function GET() {
  const context = await getDealerAccessContext();

  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  return Response.json({ offers: await getDealerOffersForContext(context) });
}

export async function POST(request: Request) {
  const context = await getDealerAccessContext();

  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const discountAmount = Number(body.discountAmount ?? 0);

  if (!title || !Number.isFinite(discountAmount) || discountAmount < 0) {
    return Response.json({ error: "Offer title and valid discount amount are required" }, { status: 400 });
  }

  try {
    const offer = await createDealerOffer(
      {
        title,
        description: typeof body.description === "string" ? body.description.trim() : undefined,
        dealerId: typeof body.dealerId === "string" && body.dealerId ? body.dealerId : undefined,
        brandId: typeof body.brandId === "string" && body.brandId ? body.brandId : undefined,
        modelId: typeof body.modelId === "string" && body.modelId ? body.modelId : undefined,
        cityId: typeof body.cityId === "string" && body.cityId ? body.cityId : undefined,
        discountAmount,
        startDate: typeof body.startDate === "string" && body.startDate ? body.startDate : undefined,
        endDate: typeof body.endDate === "string" && body.endDate ? body.endDate : undefined,
      },
      context,
    );

    return Response.json({ offer }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create offer" },
      { status: 400 },
    );
  }
}
