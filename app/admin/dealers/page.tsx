import Link from "next/link";
import { Building2, GitBranch, Store } from "lucide-react";
import { DealerAdminSubnav } from "@/components/admin/dealer-admin-shared";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";

export default async function AdminDealersPage() {
  const { dealerBusinesses, dealers, dealerBrandMappings } = await getVehicleDataSet();

  const cards = [
    {
      title: "Businesses",
      href: "/admin/dealers/businesses",
      count: dealerBusinesses.length,
      copy: "Master dealer companies and their login creation.",
      icon: Building2,
    },
    {
      title: "Showrooms",
      href: "/admin/dealers/showrooms",
      count: dealers.length,
      copy: "Outlet list, city assignment, routing priority and showroom setup.",
      icon: Store,
    },
    {
      title: "Mappings",
      href: "/admin/dealers/mappings",
      count: dealerBrandMappings.length,
      copy: "Brand-city-showroom routing used by public pricing and lead assignment.",
      icon: GitBranch,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-emerald-700">Dealer operations</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Dealer module</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Use focused list pages for businesses, showrooms and mappings. Creation stays inside each operational page instead of being mixed into one long form screen.
            </p>
          </div>
          <DealerAdminSubnav />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
              href={card.href}
              key={card.href}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-emerald-700">{card.title}</div>
                  <div className="mt-2 text-3xl font-black text-slate-950">{card.count}</div>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-lime-300 text-slate-950">
                  <Icon size={20} />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
