import { createDealerShowroomLogin } from "@/lib/services/admin-catalog";
import { getDealerAccessContext } from "@/lib/services/dealer-auth";
import { dealerShowroomLoginSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const context = await getDealerAccessContext();

  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  if (context.dealerUser.role !== "dealer_business_admin") {
    return Response.json({ error: "Only dealer business login can create showroom logins" }, { status: 403 });
  }

  const parsed = dealerShowroomLoginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid showroom login request", issues: parsed.error.flatten() }, { status: 400 });
  }

  const showroom = context.showrooms.find((item) => item.id === parsed.data.dealerId);
  if (!showroom) {
    return Response.json({ error: "Selected showroom does not belong to this dealer business" }, { status: 400 });
  }

  try {
    const dealerUser = await createDealerShowroomLogin({
      dealerBusinessId: context.business.id,
      dealerId: parsed.data.dealerId,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    return Response.json({ dealerUser }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create showroom login" },
      { status: 500 },
    );
  }
}
