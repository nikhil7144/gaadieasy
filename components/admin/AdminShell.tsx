import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { BrandLockup } from "@/components/shared/BrandLockup";

const nav = [
  ["Dashboard", "/admin"],
  ["Brands", "/admin/brands"],
  ["Models", "/admin/models"],
  ["Variants", "/admin/variants"],
  ["Cities", "/admin/cities"],
  ["Tax rules", "/admin/tax-rules"],
  ["RTO charges", "/admin/rto-charges"],
  ["Insurance", "/admin/insurance"],
  ["Dealers", "/admin/dealers"],
  ["Offers", "/admin/offers"],
  ["Leads", "/admin/leads"],
  ["Homepage banners", "/admin/homepage-banners"],
  ["City pages", "/admin/city-pages"],
  ["SEO pages", "/admin/seo-pages"],
  ["Comparisons", "/admin/comparisons"],
  ["Vehicle updates", "/admin/vehicle-updates"],
];

export function AdminShell({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="shrink-0 p-4">
          <BrandLockup href="/" size="sidebar" />
          <div className="mt-2 text-sm font-black text-slate-950">Admin workspace</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1">
            {nav.map(([label, href]) => (
              <a className="block rounded-md px-3 py-2 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-800" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-950">Platform operations</div>
              <div className="text-xs text-slate-500">
                {userEmail ? `Signed in as ${userEmail}` : "Supabase-backed admin workspace."}
              </div>
            </div>
            <AdminSignOutButton />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
