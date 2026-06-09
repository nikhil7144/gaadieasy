import { requirePlatformAdmin } from "@/lib/auth/require-admin";
import {
  createDealer,
  createDealerBrandMapping,
  createDealerBusiness,
  createDealerBusinessLogin,
} from "@/lib/services/admin-catalog";
import {
  dealerBrandMappingSchema,
  dealerBusinessLoginSchema,
  dealerBusinessSchema,
  dealerSchema,
} from "@/lib/validations/admin";
import { z } from "zod";

const dealerActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_business"), business: dealerBusinessSchema }),
  z.object({ action: z.literal("create_showroom"), dealer: dealerSchema }),
  z.object({ action: z.literal("create_mapping"), mapping: dealerBrandMappingSchema }),
  z.object({ action: z.literal("create_business_login"), login: dealerBusinessLoginSchema }),
]);

export async function POST(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  const parsed = dealerActionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid dealer request", issues: parsed.error.flatten() }, { status: 400 });

  try {
    if (parsed.data.action === "create_business") {
      return Response.json({ business: await createDealerBusiness(parsed.data.business) }, { status: 201 });
    }

    if (parsed.data.action === "create_showroom") {
      return Response.json({ dealer: await createDealer(parsed.data.dealer) }, { status: 201 });
    }

    if (parsed.data.action === "create_business_login") {
      return Response.json({ dealerUser: await createDealerBusinessLogin(parsed.data.login) }, { status: 201 });
    }

    return Response.json({ mapping: await createDealerBrandMapping(parsed.data.mapping) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save dealer data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requirePlatformAdmin();
  if (guard.response) return guard.response;

  return Response.json({ dealer: await request.json() });
}
