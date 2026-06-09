import Link from "next/link";
import { comparisonPages, leads, seoPages } from "@/lib/data";
import { getVehicleDataSet } from "@/lib/repositories/vehicle-data";
import { getAdminOffers } from "@/lib/services/admin-offers";
import { formatIndianPrice } from "@/lib/utils/format";

export async function AdminDashboard() {
  const [{ brands, cities, dealers, models, taxRules, variants }, offers] = await Promise.all([
    getVehicleDataSet(),
    getAdminOffers(),
  ]);
  const stats = [
    ["Brands", brands.length],
    ["Models", models.length],
    ["Variants", variants.length],
    ["Cities", cities.length],
    ["Dealers", dealers.length],
    ["Offers", offers.length],
    ["Leads", leads.length],
    ["SEO pages", seoPages.length],
    ["Comparisons", comparisonPages.length],
    ["Tax rules", taxRules.length],
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={label}>
            <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div id="leads" className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-xl font-black text-slate-950">Lead queue</h2>
          <div className="mt-4 space-y-3">
            {leads.map((lead) => (
              <div className="rounded-lg bg-slate-50 p-3" key={lead.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-slate-950">{lead.name}</div>
                    <div className="text-sm text-slate-600">{lead.phone}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{lead.status}</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Selected price: <strong>{formatIndianPrice(lead.selectedOnRoadPrice)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="seo" className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-xl font-black text-slate-950">Structured SEO pages</h2>
          <div className="mt-4 space-y-3">
            {seoPages.map((page) => (
              <a className="block rounded-lg bg-emerald-50 p-3" href={`/seo/${page.slug}`} key={page.id}>
                <div className="font-black text-slate-950">{page.title}</div>
                <div className="mt-1 text-xs text-emerald-700">/{page.slug}</div>
              </a>
            ))}
          </div>
        </div>

        <div id="comparisons" className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-xl font-black text-slate-950">Comparison SEO pages</h2>
          <p className="mt-1 text-sm text-slate-500">Admin-created comparison pages can appear on homepage, footer and public comparison URLs.</p>
          <div className="mt-4 space-y-3">
            {comparisonPages.map((page) => (
              <a className="block rounded-lg bg-lime-50 p-3" href={`/compare/${page.slug}`} key={page.id}>
                <div className="font-black text-slate-950">{page.title}</div>
                <div className="mt-1 text-xs text-emerald-700">/{page.slug}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  {page.showOnHomepage ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Homepage</span> : null}
                  {page.showInFooter ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Footer</span> : null}
                  <span className="rounded-full bg-white px-2 py-1 text-slate-600">{page.active ? "Active" : "Inactive"}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ["Create brand", "/admin/brands", "Add manufacturer and logo."],
          ["Create model", "/admin/models", "Add model, body type and overview."],
          ["Create variant", "/admin/variants", "Add prices and specifications."],
          ["Tax rules", "/admin/tax-rules", "State/category tax slabs."],
          ["RTO charges", "/admin/rto-charges", "Registration and local charges."],
          ["Dealers", "/admin/dealers", "Dealer profile and brand-city mapping."],
        ].map(([title, href, copy]) => (
          <Link className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50" href={href} key={href}>
            <div className="font-black text-slate-950">{title}</div>
            <div className="mt-1 text-sm text-slate-500">{copy}</div>
          </Link>
        ))}
      </section>

      <section id="tax" className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-black text-slate-950">Pricing controls</h2>
        <p className="mt-2 text-sm text-slate-600">
          Admin APIs exist for brands, models, variants, tax rules, RTO charges, dealers, SEO pages and leads. The next implementation slice should connect these forms to Supabase persistence.
        </p>
      </section>
    </div>
  );
}
