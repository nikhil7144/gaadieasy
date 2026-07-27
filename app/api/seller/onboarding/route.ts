import { requireSellerContext } from "@/lib/auth/require-seller";
import { addSellerKycDocument, updateSellerBusinessDetails, updateSellerCategoryInterest, upsertSellerBankDetails } from "@/lib/services/seller-auth";
import { sellerOnboardingSchema } from "@/lib/validations/seller";

export async function PATCH(request: Request) {
  const guard = await requireSellerContext();
  if (guard.response) return guard.response;

  const parsed = sellerOnboardingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid onboarding step", issues: parsed.error.flatten() }, { status: 400 });

  const sellerId = guard.context.seller.id;

  try {
    if (parsed.data.step === "business_details") {
      const { step, ...rest } = parsed.data;
      void step;
      return Response.json({ seller: await updateSellerBusinessDetails(sellerId, rest) });
    }

    if (parsed.data.step === "categories") {
      return Response.json({ seller: await updateSellerCategoryInterest(sellerId, parsed.data.categoryIds) });
    }

    if (parsed.data.step === "kyc_document") {
      return Response.json({ document: await addSellerKycDocument(sellerId, parsed.data) }, { status: 201 });
    }

    return Response.json({ bankDetails: await upsertSellerBankDetails(sellerId, parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save onboarding step" }, { status: 500 });
  }
}
