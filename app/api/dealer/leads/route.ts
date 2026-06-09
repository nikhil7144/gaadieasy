import { getDealerAccessContext } from "@/lib/services/dealer-auth";
import { getDealerLeadsForContext, updateDealerLeadStatus } from "@/lib/services/leads";

export async function GET() {
  const context = await getDealerAccessContext();
  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  return Response.json({ leads: await getDealerLeadsForContext(context) });
}

export async function PATCH(request: Request) {
  const context = await getDealerAccessContext();
  if (!context) {
    return Response.json({ error: "Dealer access is required" }, { status: 401 });
  }

  const body = await request.json();
  const lead = await updateDealerLeadStatus(body.leadId, body.status, context);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  return Response.json({ lead });
}
