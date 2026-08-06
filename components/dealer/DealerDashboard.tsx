import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { DealerOffersManager } from "@/components/dealer/DealerOffersManager";
import { DealerUserManager } from "@/components/dealer/DealerUserManager";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getDealerAccessContext } from "@/lib/services/dealer-auth";
import { getDealerOffersForContext } from "@/lib/services/dealer-offers";
import { describeAssignedDealer, getDealerLeadsForContext } from "@/lib/services/leads";
import { formatIndianPrice } from "@/lib/utils/format";

export async function DealerDashboard() {
  const context = await getDealerAccessContext();

  if (!context) {
    redirect("/dealer/login");
  }

  const [data, leads, offers] = await Promise.all([
    getVehicleDataSet(),
    getDealerLeadsForContext(context),
    getDealerOffersForContext(context),
  ]);

  const roleLabel =
    context.dealerUser.role === "dealer_business_admin" ? "Business master login" : "Showroom login";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <BrandLockup href="/" size="sidebar" />
            <h1 className="mt-1 text-2xl font-black text-slate-950">{context.business.name}</h1>
            <p className="text-sm text-slate-600">
              {roleLabel}
              {context.showroom ? ` - ${context.showroom.name}` : ""}
              {context.userEmail ? ` - ${context.userEmail}` : ""}
            </p>
          </div>
          <AdminSignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {context.business.verificationStatus === "pending" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            Your business is under review — typically approved within 1-2 business days. You can still manage your
            showroom details, offers, and leads in the meantime.
          </div>
        )}
        {context.business.verificationStatus === "rejected" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            Your business application was not approved.
            {context.business.rejectionReason && <p className="mt-1 font-normal">{context.business.rejectionReason}</p>}
            <p className="mt-1 font-normal">Please contact support to request another review.</p>
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-emerald-700">Lead visibility</p>
            <div className="mt-2 text-3xl font-black text-slate-950">{leads.length}</div>
            <p className="text-sm text-slate-500">
              {context.dealerUser.role === "dealer_business_admin" ? "Across mapped showrooms" : "Assigned showroom leads"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-emerald-700">Showrooms</p>
            <div className="mt-2 text-3xl font-black text-slate-950">{context.showrooms.length}</div>
            <p className="text-sm text-slate-500">Outlets under this dealer business</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase text-emerald-700">Offers</p>
            <div className="mt-2 text-3xl font-black text-slate-950">{offers.length}</div>
            <p className="text-sm text-slate-500">Pending or approved dealer campaigns</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Lead queue</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Assigned buyer enquiries</h2>
            </div>
            <Link href="/api/dealer/leads" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
              API
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {leads.length ? leads.map((lead) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={lead.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-slate-950">{lead.name}</div>
                    <div className="text-sm text-slate-600">
                      {lead.phone}
                      {lead.email ? ` - ${lead.email}` : ""}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Selected price: <strong>{formatIndianPrice(lead.selectedOnRoadPrice)}</strong>
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase text-slate-400">
                      {describeAssignedDealer(lead, data.dealers)}
                    </div>
                  </div>
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-slate-950">
                    {lead.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-500">
                No leads assigned to this dealer login yet.
              </div>
            )}
          </div>
        </section>

        {context.dealerUser.role === "dealer_business_admin" ? (
          <DealerUserManager showrooms={context.showrooms} />
        ) : null}

        <DealerOffersManager
          offers={offers}
          showrooms={context.showrooms}
          brands={data.brands}
          models={data.models}
          cities={data.cities}
          canSelectShowroom={context.dealerUser.role === "dealer_business_admin"}
        />
      </main>
    </div>
  );
}
