"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { GearBrandLockup } from "@/components/shared/GearBrandLockup";

const nav = [
  { label: "Overview", href: "/seller", icon: LayoutDashboard },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Payouts", href: "/seller/payouts", icon: Wallet },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

export function SellerShell({
  children,
  businessName,
  roleLabel,
  userEmail,
}: {
  children: React.ReactNode;
  businessName: string;
  roleLabel: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => (href === "/seller" ? pathname === "/seller" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <aside
        className={`fixed inset-y-0 left-0 hidden flex-col bg-[#1c1c1c] transition-[width] duration-150 md:flex ${collapsed ? "w-12" : "w-[220px]"}`}
      >
        <div className={`shrink-0 border-b border-white/10 p-3 ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#3ecf8e] text-xs font-black text-black">GG</div>
          ) : (
            <GearBrandLockup size="sidebar" />
          )}
          {!collapsed && (
            <>
              <div className="mt-2 truncate text-sm font-black text-white">{businessName}</div>
              <div className="truncate text-xs text-[#a1a1aa]">
                {roleLabel}
                {userEmail ? ` · ${userEmail}` : ""}
              </div>
            </>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="space-y-0.5 px-2">
            {nav.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-bold transition ${
                    active ? "bg-[#3ecf8e]/10 text-[#3ecf8e]" : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                  }`}
                  href={href}
                  key={href}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="shrink-0" size={16} strokeWidth={1.75} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="shrink-0 border-t border-white/10 p-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-bold text-[#a1a1aa] transition hover:bg-white/5 hover:text-white"
            onClick={() => setCollapsed((c) => !c)}
            type="button"
          >
            {collapsed ? <ChevronsRight size={16} strokeWidth={1.75} /> : <ChevronsLeft size={16} strokeWidth={1.75} />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>
      <div className={collapsed ? "md:pl-12" : "md:pl-[220px]"}>
        <header className="sticky top-0 z-20 border-b border-black/[0.08] bg-white/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <GearBrandLockup size="sidebar" />
            <div className="flex items-center gap-1">
              <AdminSignOutButton />
              <button
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                className="rounded-md p-2 text-[#1c1c1c] transition hover:bg-black/5"
                onClick={() => setMobileNavOpen((open) => !open)}
                type="button"
              >
                {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
          <nav
            className={`overflow-hidden border-t border-black/[0.08] bg-white transition-all duration-150 ease-in-out ${
              mobileNavOpen ? "max-h-96 opacity-100" : "max-h-0 border-t-0 opacity-0"
            }`}
          >
            <div className="space-y-0.5 px-3 py-2">
              {nav.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-bold transition ${
                      active ? "bg-[#3ecf8e]/10 text-[#0f9d63]" : "text-[#52525b] hover:bg-black/5"
                    }`}
                    href={href}
                    key={href}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="shrink-0" size={17} strokeWidth={1.75} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </header>
        <header className="hidden items-center justify-end border-b border-black/[0.08] bg-white px-4 py-3 md:flex">
          <AdminSignOutButton />
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
