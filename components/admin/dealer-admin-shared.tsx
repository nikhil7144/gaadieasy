"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dealers", label: "Overview" },
  { href: "/admin/dealers/businesses", label: "Businesses" },
  { href: "/admin/dealers/showrooms", label: "Showrooms" },
  { href: "/admin/dealers/mappings", label: "Mappings" },
];

export function DealerAdminSubnav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            className={`rounded-full px-4 py-2 text-sm font-black ${
              active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export function dealerStatusPill(active: boolean, verified?: boolean) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={`rounded-full px-2 py-1 text-[11px] font-black ${
          active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </span>
      {verified !== undefined ? (
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-black ${
            verified ? "bg-lime-100 text-lime-900" : "bg-amber-50 text-amber-700"
          }`}
        >
          {verified ? "Verified" : "Unverified"}
        </span>
      ) : null}
    </div>
  );
}
